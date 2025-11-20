package leagues

import (
	"context"
	"fmt"
	"log/slog"
	"math"
	"time"

	"github.com/supabase-community/postgrest-go"
	"github.com/leaguefindr/backend/internal/auth"
	"github.com/leaguefindr/backend/internal/notifications"
	"github.com/leaguefindr/backend/internal/organizations"
	"github.com/leaguefindr/backend/internal/sports"
	"github.com/leaguefindr/backend/internal/venues"
)

type Service struct {
	baseClient            *postgrest.Client
	baseURL               string
	apiKey                string
	orgService            *organizations.Service
	authService           *auth.Service
	sportsService         *sports.Service
	venuesService         *venues.Service
	notificationsService  *notifications.Service
}

func NewService(baseClient *postgrest.Client, baseURL string, apiKey string, orgService *organizations.Service, authService *auth.Service, sportsService *sports.Service, venuesService *venues.Service, notificationsService *notifications.Service) *Service {
	return &Service{
		baseClient:            baseClient,
		baseURL:               baseURL,
		apiKey:                apiKey,
		orgService:            orgService,
		authService:           authService,
		sportsService:         sportsService,
		venuesService:         venuesService,
		notificationsService:  notificationsService,
	}
}

// getClientWithAuth creates a new PostgREST client with JWT from context
func (s *Service) getClientWithAuth(ctx context.Context) *postgrest.Client {
	// Extract JWT token from context (set by JWT middleware)
	token := ""
	if jwtVal := ctx.Value("jwt_token"); jwtVal != nil {
		if t, ok := jwtVal.(string); ok {
			token = t
		}
	}

	// Create a new client with the API key in headers
	headers := map[string]string{
		"apikey": s.apiKey,
	}

	client := postgrest.NewClient(s.baseURL, "public", headers)

	// Set JWT token if present (overrides default auth)
	if token != "" {
		client.SetAuthToken(token)
	}

	return client
}

// ============= LEAGUE METHODS =============

// GetAllLeagues retrieves all leagues (admin only)
func (s *Service) GetAllLeagues(ctx context.Context) ([]League, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetAll(ctx)
}

// GetLeaguesByOrgID retrieves all leagues for a specific organization
func (s *Service) GetLeaguesByOrgID(ctx context.Context, orgID string) ([]League, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetByOrgID(ctx, orgID)
}

// GetLeaguesByOrgIDAndStatus retrieves leagues filtered by organization and status
func (s *Service) GetLeaguesByOrgIDAndStatus(ctx context.Context, orgID string, status LeagueStatus) ([]League, error) {
	if !status.IsValid() {
		return nil, fmt.Errorf("invalid league status: %s", status)
	}
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetByOrgIDAndStatus(ctx, orgID, status)
}

// GetApprovedLeagues retrieves all approved leagues (public)
func (s *Service) GetApprovedLeagues(ctx context.Context) ([]League, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetAllApproved(ctx)
}

// GetApprovedLeaguesWithPagination retrieves approved leagues with pagination
func (s *Service) GetApprovedLeaguesWithPagination(ctx context.Context, limit, offset int) ([]League, int64, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetAllApprovedWithPagination(ctx, limit, offset)
}

// GetLeagueByID retrieves a league by ID (admin only - any status)
// Deprecated: Use GetLeagueByUUID instead
func (s *Service) GetLeagueByID(ctx context.Context, id int) (*League, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetByID(ctx, id)
}

// GetLeagueByUUID retrieves a league by UUID
func (s *Service) GetLeagueByUUID(ctx context.Context, id string) (*League, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetByUUID(ctx, id)
}

// GetPendingLeagues retrieves all pending league submissions (admin only)
func (s *Service) GetPendingLeagues(ctx context.Context) ([]League, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetPending(ctx)
}

// GetPendingLeaguesWithPagination retrieves pending leagues with pagination support
func (s *Service) GetPendingLeaguesWithPagination(ctx context.Context, limit, offset int) ([]League, int64, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetPendingWithPagination(ctx, limit, offset)
}

// GetAllLeaguesWithPagination retrieves all leagues regardless of status with pagination support
func (s *Service) GetAllLeaguesWithPagination(ctx context.Context, limit, offset int) ([]League, int64, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetAllWithPagination(ctx, limit, offset)
}

// CreateLeague creates a new league with validation and pricing calculation
func (s *Service) CreateLeague(ctx context.Context, userID string, orgID string, request *CreateLeagueRequest) (*League, error) {
	if request == nil {
		return nil, fmt.Errorf("create league request cannot be nil")
	}

	if orgID == "" {
		return nil, fmt.Errorf("organization ID is required")
	}

	err := s.orgService.VerifyUserOrgAccess(ctx, userID, orgID)
	if err != nil {
		return nil, fmt.Errorf("user does not have access to this organization: %w", err)
	}

	// Validate pricing strategy
	if !request.PricingStrategy.IsValid() {
		return nil, fmt.Errorf("invalid pricing strategy: %s", request.PricingStrategy)
	}

	// Parse dates
	regDeadlineParsed, err := time.Parse("2006-01-02", *request.RegistrationDeadline)
	if err != nil {
		return nil, fmt.Errorf("invalid registration deadline format: %w", err)
	}
	regDeadline := &Date{regDeadlineParsed}

	seasonStartParsed, err := time.Parse("2006-01-02", *request.SeasonStartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid season start date format: %w", err)
	}
	seasonStart := &Date{seasonStartParsed}

	var seasonEnd *Date
	if request.SeasonEndDate != nil {
		parsedEnd, err := time.Parse("2006-01-02", *request.SeasonEndDate)
		if err != nil {
			return nil, fmt.Errorf("invalid season end date format: %w", err)
		}
		seasonEnd = &Date{parsedEnd}
	}

	// Calculate per-player pricing
	pricingPerPlayer := s.calculatePricingPerPlayer(request.PricingStrategy, request.PricingAmount, request.MinimumTeamPlayers)

	// Build supplemental requests for sport/venue if IDs are not provided
	var supplementalRequests *SupplementalRequests
	if request.SportID == nil {
		// Sport doesn't exist, add to supplemental requests
		if supplementalRequests == nil {
			supplementalRequests = &SupplementalRequests{}
		}
		supplementalRequests.Sport = &SupplementalSport{
			Name: request.SportName,
		}
	}

	if request.VenueID == nil && request.VenueAddress != nil {
		// Venue doesn't exist, add to supplemental requests
		if supplementalRequests == nil {
			supplementalRequests = &SupplementalRequests{}
		}
		supplementalRequests.Venue = &SupplementalVenue{
			Name:    *request.VenueName,
			Address: *request.VenueAddress,
			Lat:     request.VenueLat,
			Lng:     request.VenueLng,
		}
	}

	// Create league struct - store orgID in a variable before taking its address
	orgIDValue := orgID
	createdByValue := userID

	// Get organization name from request or fetch from database
	orgName := ""
	if request.OrganizationName != nil && *request.OrganizationName != "" {
		orgName = *request.OrganizationName
	} else {
		// Fallback: query organization table if name not provided
		org, err := s.orgService.GetOrganizationByID(ctx, orgID)
		if err == nil && org != nil {
			orgName = org.OrgName
		}
	}

	// Convert request to map for form_data
	formDataMap := map[string]interface{}{
		"sport_id":              request.SportID,
		"sport_name":            request.SportName,
		"organization_name":     orgName,
		"league_name":           request.LeagueName,
		"division":              request.Division,
		"registration_deadline": *request.RegistrationDeadline,
		"season_start_date":     *request.SeasonStartDate,
		"season_end_date":       request.SeasonEndDate,
		"game_occurrences":      request.GameOccurrences,
		"pricing_strategy":      request.PricingStrategy,
		"pricing_amount":        request.PricingAmount,
		"venue_id":              request.VenueID,
		"venue_name":            request.VenueName,
		"venue_address":         request.VenueAddress,
		"venue_lat":             request.VenueLat,
		"venue_lng":             request.VenueLng,
		"gender":                request.Gender,
		"season_details":        request.SeasonDetails,
		"registration_url":      request.RegistrationURL,
		"duration":              request.Duration,
		"minimum_team_players":  request.MinimumTeamPlayers,
		"per_game_fee":          request.PerGameFee,
		"org_id":                orgID,
	}

	league := &League{
		OrgID:                &orgIDValue,
		SportID:              request.SportID,
		LeagueName:           request.LeagueName,
		Division:             request.Division,
		RegistrationDeadline: regDeadline,
		SeasonStartDate:      seasonStart,
		SeasonEndDate:        seasonEnd,
		GameOccurrences:      request.GameOccurrences,
		PricingStrategy:      request.PricingStrategy,
		PricingAmount:        request.PricingAmount,
		PricingPerPlayer:     pricingPerPlayer,
		VenueID:              request.VenueID,
		Gender:               request.Gender,
		SeasonDetails:        request.SeasonDetails,
		RegistrationURL:      request.RegistrationURL,
		Duration:             request.Duration,
		MinimumTeamPlayers:   request.MinimumTeamPlayers,
		PerGameFee:           request.PerGameFee,
		SupplementalRequests: supplementalRequests,
		FormData:             FormData(formDataMap),
		Status:               LeagueStatusPending,
		CreatedBy:            &createdByValue,
	}

	// Save league
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	if err := repo.Create(ctx, league); err != nil {
		return nil, fmt.Errorf("failed to create league: %w", err)
	}

	// Send notification to all admins that a new league was submitted
	leagueName := ""
	if league.LeagueName != nil {
		leagueName = *league.LeagueName
	}
	notificationErr := s.notificationsService.CreateNotificationForAllAdmins(
		context.Background(),
		notifications.NotificationLeagueSubmitted.String(),
		"New League Submitted",
		fmt.Sprintf("A new league '%s' has been submitted for approval", leagueName),
		nil,
		league.OrgID,
	)
	if notificationErr != nil {
		slog.Warn("failed to send league submitted notification to admins", "leagueID", league.ID, "err", notificationErr)
		// Don't return error - league was already created, notification failure isn't critical
	}

	return league, nil
}

// ApproveLeague approves a pending league submission (admin only)
// If sport_id is nil and form_data has sport_name, creates the sport
// If venue_id is nil and form_data has venue_name, creates the venue
func (s *Service) ApproveLeague(ctx context.Context, userID string, id int) error {
	// Verify user is admin
	isAdmin, err := s.authService.IsUserAdmin(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to verify admin status: %w", err)
	}
	if !isAdmin {
		return fmt.Errorf("only admins can approve leagues")
	}

	// Get the league to check form_data
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	league, err := repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to fetch league: %w", err)
	}

	// If sport_id is nil and form_data has sport_name, create it
	if league.SportID == nil && league.FormData != nil {
		if sportName, ok := league.FormData["sport_name"].(string); ok && sportName != "" {
			newSport, err := s.sportsService.CreateSport(ctx, &sports.CreateSportRequest{
				Name: sportName,
			})
			if err != nil {
				return fmt.Errorf("failed to create sport: %w", err)
			}
			league.SportID = &newSport.ID
		}
	}

	// If venue_id is nil and form_data has venue_name, create it
	if league.VenueID == nil && league.FormData != nil {
		venueName, hasName := league.FormData["venue_name"].(string)
		venueAddress, hasAddress := league.FormData["venue_address"].(string)
		if (hasName && venueName != "") || (hasAddress && venueAddress != "") {
			lat := 0.0
			lng := 0.0
			if venueLatVal, ok := league.FormData["venue_lat"].(float64); ok {
				lat = venueLatVal
			}
			if venueLngVal, ok := league.FormData["venue_lng"].(float64); ok {
				lng = venueLngVal
			}

			venueReq := &venues.CreateVenueRequest{
				Name:    venueName,
				Address: venueAddress,
				Lat:     lat,
				Lng:     lng,
			}
			newVenue, err := s.venuesService.CreateVenue(ctx, venueReq)
			if err != nil {
				return fmt.Errorf("failed to create venue: %w", err)
			}
			league.VenueID = &newVenue.ID
		}
	}

	// Atomically update league IDs and status to approved in a single transaction
	// This ensures both updates succeed or both fail together
	err = repo.ApproveLeagueWithTransaction(ctx, id, league.SportID, league.VenueID)
	if err != nil {
		return err
	}

	// Send notification to league creator that their league was approved
	if league.CreatedBy != nil {
		ctx := context.Background()
		notificationErr := s.notificationsService.CreateNotification(
			ctx,
			*league.CreatedBy,
			notifications.NotificationLeagueApproved.String(),
			"League Approved",
			fmt.Sprintf("Your league '%s' has been approved!", league.LeagueName),
			&id,
			nil,
		)
		if notificationErr != nil {
			slog.Error("failed to send league approval notification", "leagueID", id, "userID", league.CreatedBy, "err", notificationErr)
			// Don't return error - league was already approved, notification failure isn't critical
		}
	}

	return nil
}

// RejectLeague rejects a pending league submission with a reason (admin only)
func (s *Service) RejectLeague(ctx context.Context, userID string, id int, rejectionReason string) error {
	// Verify user is admin
	isAdmin, err := s.authService.IsUserAdmin(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to verify admin status: %w", err)
	}
	if !isAdmin {
		return fmt.Errorf("only admins can reject leagues")
	}

	if rejectionReason == "" {
		return fmt.Errorf("rejection reason cannot be empty")
	}

	// Get the league to retrieve creator info
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	league, err := repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to fetch league: %w", err)
	}

	// Update the league status
	err = repo.UpdateStatus(ctx, id, LeagueStatusRejected, &rejectionReason)
	if err != nil {
		return err
	}

	// Send notification to league creator that their league was rejected
	if league.CreatedBy != nil {
		ctx := context.Background()
		notificationErr := s.notificationsService.CreateNotification(
			ctx,
			*league.CreatedBy,
			notifications.NotificationLeagueRejected.String(),
			"League Rejected",
			fmt.Sprintf("Your league '%s' was rejected. Reason: %s", league.LeagueName, rejectionReason),
			&id,
			nil,
		)
		if notificationErr != nil {
			slog.Error("failed to send league rejection notification", "leagueID", id, "userID", league.CreatedBy, "err", notificationErr)
			// Don't return error - league was already rejected, notification failure isn't critical
		}
	}

	return nil
}

// ApproveLeagueByUUID approves a pending league submission by UUID (admin only)
func (s *Service) ApproveLeagueByUUID(ctx context.Context, userID string, id string) error {
	// Verify user is admin
	isAdmin, err := s.authService.IsUserAdmin(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to verify admin status: %w", err)
	}
	if !isAdmin {
		return fmt.Errorf("only admins can approve leagues")
	}

	// Get the league to check form_data
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	league, err := repo.GetByUUID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to fetch league: %w", err)
	}

	// Check if league is already approved
	if league.Status == LeagueStatusApproved {
		return fmt.Errorf("league is already approved")
	}

	// If sport_id is nil and form_data has sport_name, create it
	if league.SportID == nil && league.FormData != nil {
		if sportName, ok := league.FormData["sport_name"].(string); ok && sportName != "" {
			newSport, err := s.sportsService.CreateSport(ctx, &sports.CreateSportRequest{
				Name: sportName,
			})
			if err != nil {
				return fmt.Errorf("failed to create sport: %w", err)
			}
			league.SportID = &newSport.ID
		}
	}

	// If venue_id is nil and form_data has venue_name, create it
	if league.VenueID == nil && league.FormData != nil {
		venueName, hasName := league.FormData["venue_name"].(string)
		venueAddress, hasAddress := league.FormData["venue_address"].(string)
		if (hasName && venueName != "") || (hasAddress && venueAddress != "") {
			lat := 0.0
			lng := 0.0
			if venueLatVal, ok := league.FormData["venue_lat"].(float64); ok {
				lat = venueLatVal
			}
			if venueLngVal, ok := league.FormData["venue_lng"].(float64); ok {
				lng = venueLngVal
			}

			venueReq := &venues.CreateVenueRequest{
				Name:    venueName,
				Address: venueAddress,
				Lat:     lat,
				Lng:     lng,
			}
			newVenue, err := s.venuesService.CreateVenue(ctx, venueReq)
			if err != nil {
				return fmt.Errorf("failed to create venue: %w", err)
			}
			league.VenueID = &newVenue.ID
		}
	}

	// Update league status to approved
	err = repo.UpdateStatusByUUID(ctx, id, LeagueStatusApproved, nil)
	if err != nil {
		return err
	}

	// Send notification to league creator that their league was approved
	if league.CreatedBy != nil {
		leagueName := ""
		if league.LeagueName != nil {
			leagueName = *league.LeagueName
		}
		ctx := context.Background()
		notificationErr := s.notificationsService.CreateNotification(
			ctx,
			*league.CreatedBy,
			notifications.NotificationLeagueApproved.String(),
			"League Approved",
			fmt.Sprintf("Your league '%s' has been approved!", leagueName),
			nil,
			league.OrgID,
		)
		if notificationErr != nil {
			slog.Error("failed to send league approval notification", "leagueID", id, "userID", league.CreatedBy, "err", notificationErr)
			// Don't return error - league was already approved, notification failure isn't critical
		}
	}

	return nil
}

// RejectLeagueByUUID rejects a pending league submission with a reason by UUID (admin only)
func (s *Service) RejectLeagueByUUID(ctx context.Context, userID string, id string, rejectionReason string) error {
	// Verify user is admin
	isAdmin, err := s.authService.IsUserAdmin(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to verify admin status: %w", err)
	}
	if !isAdmin {
		return fmt.Errorf("only admins can reject leagues")
	}

	if rejectionReason == "" {
		return fmt.Errorf("rejection reason cannot be empty")
	}

	// Get the league to retrieve creator info
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	league, err := repo.GetByUUID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to fetch league: %w", err)
	}

	// Check if league is already rejected
	if league.Status == LeagueStatusRejected {
		return fmt.Errorf("league is already rejected")
	}

	// Update the league status
	err = repo.UpdateStatusByUUID(ctx, id, LeagueStatusRejected, &rejectionReason)
	if err != nil {
		return err
	}

	// Send notification to league creator that their league was rejected
	if league.CreatedBy != nil {
		leagueName := ""
		if league.LeagueName != nil {
			leagueName = *league.LeagueName
		}
		ctx := context.Background()
		notificationErr := s.notificationsService.CreateNotification(
			ctx,
			*league.CreatedBy,
			notifications.NotificationLeagueRejected.String(),
			"League Rejected",
			fmt.Sprintf("Your league '%s' was rejected. Reason: %s", leagueName, rejectionReason),
			nil,
			league.OrgID,
		)
		if notificationErr != nil {
			slog.Error("failed to send league rejection notification", "leagueID", id, "userID", league.CreatedBy, "err", notificationErr)
			// Don't return error - league was already rejected, notification failure isn't critical
		}
	}

	return nil
}

// ============= DRAFT METHODS =============

// GetDraft retrieves the draft for an organization
func (s *Service) GetDraft(ctx context.Context, orgID string) (*LeagueDraft, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetDraftByOrgID(ctx, orgID)
}

// SaveDraft saves or updates a draft for an organization
func (s *Service) SaveDraft(ctx context.Context, orgID string, userID string, draftName *string, formData FormData) (*LeagueDraft, error) {
	if formData == nil || len(formData) == 0 {
		return nil, fmt.Errorf("draft data cannot be empty")
	}

	// Auto-generate draft name from league_name if not provided
	var name *string
	if draftName != nil && *draftName != "" {
		name = draftName
	} else if leagueName, ok := formData["league_name"].(string); ok && leagueName != "" {
		generatedName := leagueName + " Draft"
		name = &generatedName
	}

	draft := &LeagueDraft{
		OrgID:    orgID,
		Type:     DraftTypeDraft,
		Name:     name,
		FormData: formData,
		CreatedBy: &userID,
	}

	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	if err := repo.SaveDraft(ctx, draft); err != nil {
		return nil, fmt.Errorf("failed to save draft: %w", err)
	}

	return draft, nil
}

// UpdateDraft updates an existing draft with new data
func (s *Service) UpdateDraft(ctx context.Context, draftID int, orgID string, formData FormData) (*LeagueDraft, error) {
	if formData == nil || len(formData) == 0 {
		return nil, fmt.Errorf("draft data cannot be empty")
	}

	// Fetch existing draft to preserve original fields
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	existing, err := repo.GetDraftByID(ctx, draftID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch draft: %w", err)
	}

	// Verify draft belongs to the organization
	if existing.OrgID != orgID {
		return nil, fmt.Errorf("draft does not belong to this organization")
	}

	// Update draft data while preserving other fields
	existing.FormData = formData
	existing.UpdatedAt = Timestamp{time.Now()}

	if err := repo.SaveDraft(ctx, existing); err != nil {
		return nil, fmt.Errorf("failed to update draft: %w", err)
	}

	return existing, nil
}

// SaveTemplate saves a league configuration as a reusable template
func (s *Service) SaveTemplate(ctx context.Context, orgID string, userID string, name string, formData FormData) (*LeagueDraft, error) {
	if formData == nil || len(formData) == 0 {
		return nil, fmt.Errorf("draft data cannot be empty")
	}

	if name == "" {
		return nil, fmt.Errorf("template name is required")
	}

	template := &LeagueDraft{
		OrgID:    orgID,
		Type:     DraftTypeTemplate,
		Name:     &name,
		FormData: formData,
		CreatedBy: &userID,
	}

	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	if err := repo.SaveDraft(ctx, template); err != nil {
		return nil, fmt.Errorf("failed to save template: %w", err)
	}

	return template, nil
}

// GetTemplatesByOrgID retrieves all templates for an organization
func (s *Service) GetTemplatesByOrgID(ctx context.Context, orgID string) ([]LeagueDraft, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetTemplatesByOrgID(ctx, orgID)
}

// GetDraftsByOrgID retrieves all drafts for an organization
func (s *Service) GetDraftsByOrgID(ctx context.Context, orgID string) ([]LeagueDraft, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetDraftsByOrgID(ctx, orgID)
}

// UpdateTemplate updates an existing template
func (s *Service) UpdateTemplate(ctx context.Context, templateID int, orgID string, name string, formData FormData) (*LeagueDraft, error) {
	if name == "" {
		return nil, fmt.Errorf("template name is required")
	}

	if formData == nil || len(formData) == 0 {
		return nil, fmt.Errorf("draft data cannot be empty")
	}

	template := &LeagueDraft{
		ID:       templateID,
		OrgID:    orgID,
		Name:     &name,
		FormData: formData,
		Type:     DraftTypeTemplate,
	}

	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	if err := repo.UpdateTemplate(ctx, template); err != nil {
		return nil, fmt.Errorf("failed to update template: %w", err)
	}

	return template, nil
}

// DeleteTemplate deletes a template
func (s *Service) DeleteTemplate(ctx context.Context, templateID int, orgID string) error {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.DeleteTemplate(ctx, templateID, orgID)
}

// DeleteDraftByID deletes a specific draft by ID for an organization
func (s *Service) DeleteDraftByID(ctx context.Context, draftID int, orgID string) error {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.DeleteDraftByID(ctx, draftID, orgID)
}

// GetAllDrafts retrieves all league drafts across all organizations (admin only)
func (s *Service) GetAllDrafts(ctx context.Context) ([]LeagueDraft, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetAllDrafts(ctx)
}

// GetAllTemplates retrieves all templates across all organizations (admin only)
func (s *Service) GetAllTemplates(ctx context.Context) ([]LeagueDraft, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetAllTemplates(ctx)
}

// ============= HELPER METHODS =============

// calculatePricingPerPlayer calculates the per-player price based on pricing strategy
func (s *Service) calculatePricingPerPlayer(strategy PricingStrategy, pricingAmount *float64, minimumTeamPlayers *int) *float64 {
	if pricingAmount == nil {
		return nil
	}

	var pricePerPlayer float64

	switch strategy {
	case PricingStrategyPerTeam:
		// For per-team pricing, divide team cost by minimum team players and round up
		if minimumTeamPlayers != nil && *minimumTeamPlayers > 0 {
			pricePerPlayer = math.Ceil(*pricingAmount / float64(*minimumTeamPlayers))
		} else {
			// If minimum team players not set, use pricing amount as-is
			pricePerPlayer = *pricingAmount
		}
	case PricingStrategyPerPerson:
		// For per-person pricing, use the amount directly
		pricePerPlayer = *pricingAmount
	default:
		// Default to per-person if strategy is invalid
		pricePerPlayer = *pricingAmount
	}

	return &pricePerPlayer
}
