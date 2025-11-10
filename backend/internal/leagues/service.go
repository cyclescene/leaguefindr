package leagues

import (
	"fmt"
	"math"
	"time"

	"github.com/leaguefindr/backend/internal/auth"
	"github.com/leaguefindr/backend/internal/organizations"
	"github.com/leaguefindr/backend/internal/sports"
	"github.com/leaguefindr/backend/internal/venues"
)

type Service struct {
	repo           RepositoryInterface
	orgService     *organizations.Service
	authService    *auth.Service
	sportsService  *sports.Service
	venuesService  *venues.Service
}

func NewService(repo RepositoryInterface, orgService *organizations.Service, authService *auth.Service, sportsService *sports.Service, venuesService *venues.Service) *Service {
	return &Service{
		repo:           repo,
		orgService:     orgService,
		authService:    authService,
		sportsService:  sportsService,
		venuesService:  venuesService,
	}
}

// ============= LEAGUE METHODS =============

// GetAllLeagues retrieves all leagues (admin only)
func (s *Service) GetAllLeagues() ([]League, error) {
	return s.repo.GetAll()
}

// GetLeaguesByOrgID retrieves all leagues for a specific organization
func (s *Service) GetLeaguesByOrgID(orgID string) ([]League, error) {
	return s.repo.GetByOrgID(orgID)
}

// GetLeaguesByOrgIDAndStatus retrieves leagues filtered by organization and status
func (s *Service) GetLeaguesByOrgIDAndStatus(orgID string, status LeagueStatus) ([]League, error) {
	if !status.IsValid() {
		return nil, fmt.Errorf("invalid league status: %s", status)
	}
	return s.repo.GetByOrgIDAndStatus(orgID, status)
}

// GetApprovedLeagues retrieves all approved leagues (public)
func (s *Service) GetApprovedLeagues() ([]League, error) {
	return s.repo.GetAllApproved()
}

// GetLeagueByID retrieves a single approved league by ID (public)
func (s *Service) GetLeagueByID(id int) (*League, error) {
	return s.repo.GetByID(id)
}

// GetPendingLeagues retrieves all pending league submissions (admin only)
func (s *Service) GetPendingLeagues() ([]League, error) {
	return s.repo.GetPending()
}

// CreateLeague creates a new league with validation and pricing calculation
func (s *Service) CreateLeague(userID string, orgID string, request *CreateLeagueRequest) (*League, error) {
	if request == nil {
		return nil, fmt.Errorf("create league request cannot be nil")
	}

	if orgID == "" {
		return nil, fmt.Errorf("organization ID is required")
	}

	err := s.orgService.VerifyUserOrgAccess(userID, orgID)
	if err != nil {
		return nil, fmt.Errorf("user does not have access to this organization: %w", err)
	}

	// Validate pricing strategy
	if !request.PricingStrategy.IsValid() {
		return nil, fmt.Errorf("invalid pricing strategy: %s", request.PricingStrategy)
	}

	// Parse dates
	regDeadline, err := time.Parse("2006-01-02", *request.RegistrationDeadline)
	if err != nil {
		return nil, fmt.Errorf("invalid registration deadline format: %w", err)
	}

	seasonStart, err := time.Parse("2006-01-02", *request.SeasonStartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid season start date format: %w", err)
	}

	var seasonEnd *time.Time
	if request.SeasonEndDate != nil {
		parsedEnd, err := time.Parse("2006-01-02", *request.SeasonEndDate)
		if err != nil {
			return nil, fmt.Errorf("invalid season end date format: %w", err)
		}
		seasonEnd = &parsedEnd
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

	// Convert request to map for draft_data
	draftDataMap := map[string]interface{}{
		"sport_id":              request.SportID,
		"sport_name":            request.SportName,
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
		"organization_name":     "", // Will be populated from org context if needed
	}

	league := &League{
		OrgID:                &orgIDValue,
		SportID:              request.SportID,
		LeagueName:           request.LeagueName,
		Division:             request.Division,
		RegistrationDeadline: &regDeadline,
		SeasonStartDate:      &seasonStart,
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
		DraftData:            DraftData(draftDataMap),
		Status:               LeagueStatusPending,
		CreatedBy:            &createdByValue,
	}

	// Save league
	if err := s.repo.Create(league); err != nil {
		return nil, fmt.Errorf("failed to create league: %w", err)
	}

	return league, nil
}

// ApproveLeague approves a pending league submission (admin only)
// If sport_id is nil and supplemental_requests.sport exists, creates the sport
// If venue_id is nil and supplemental_requests.venue exists, creates the venue
func (s *Service) ApproveLeague(userID string, id int) error {
	// Verify user is admin
	isAdmin, err := s.authService.IsUserAdmin(userID)
	if err != nil {
		return fmt.Errorf("failed to verify admin status: %w", err)
	}
	if !isAdmin {
		return fmt.Errorf("only admins can approve leagues")
	}

	// Get the league to check supplemental requests
	league, err := s.repo.GetByID(id)
	if err != nil {
		return fmt.Errorf("failed to fetch league: %w", err)
	}

	// If sport_id is nil and supplemental requests has sport, create it
	if league.SportID == nil && league.SupplementalRequests != nil && league.SupplementalRequests.Sport != nil {
		newSport, err := s.sportsService.CreateSport(userID, &sports.CreateSportRequest{
			Name: league.SupplementalRequests.Sport.Name,
		})
		if err != nil {
			return fmt.Errorf("failed to create sport: %w", err)
		}
		league.SportID = &newSport.ID
	}

	// If venue_id is nil and supplemental requests has venue, create it
	if league.VenueID == nil && league.SupplementalRequests != nil && league.SupplementalRequests.Venue != nil {
		lat := 0.0
		lng := 0.0
		if league.SupplementalRequests.Venue.Lat != nil {
			lat = *league.SupplementalRequests.Venue.Lat
		}
		if league.SupplementalRequests.Venue.Lng != nil {
			lng = *league.SupplementalRequests.Venue.Lng
		}
		venueReq := &venues.CreateVenueRequest{
			Name:    league.SupplementalRequests.Venue.Name,
			Address: league.SupplementalRequests.Venue.Address,
			Lat:     lat,
			Lng:     lng,
		}
		newVenue, err := s.venuesService.CreateVenue(userID, venueReq)
		if err != nil {
			return fmt.Errorf("failed to create venue: %w", err)
		}
		league.VenueID = &newVenue.ID
	}

	// Atomically update league IDs and status to approved in a single transaction
	// This ensures both updates succeed or both fail together
	return s.repo.ApproveLeagueWithTransaction(id, league.SportID, league.VenueID)
}

// RejectLeague rejects a pending league submission with a reason (admin only)
func (s *Service) RejectLeague(userID string, id int, rejectionReason string) error {
	// Verify user is admin
	isAdmin, err := s.authService.IsUserAdmin(userID)
	if err != nil {
		return fmt.Errorf("failed to verify admin status: %w", err)
	}
	if !isAdmin {
		return fmt.Errorf("only admins can reject leagues")
	}

	if rejectionReason == "" {
		return fmt.Errorf("rejection reason cannot be empty")
	}
	return s.repo.UpdateStatus(id, LeagueStatusRejected, &rejectionReason)
}

// ============= DRAFT METHODS =============

// GetDraft retrieves the draft for an organization
func (s *Service) GetDraft(orgID string) (*LeagueDraft, error) {
	return s.repo.GetDraftByOrgID(orgID)
}

// SaveDraft saves or updates a draft for an organization
func (s *Service) SaveDraft(orgID string, userID string, draftData DraftData) (*LeagueDraft, error) {
	if draftData == nil || len(draftData) == 0 {
		return nil, fmt.Errorf("draft data cannot be empty")
	}

	draft := &LeagueDraft{
		OrgID:     orgID,
		Type:      DraftTypeDraft,
		DraftData: draftData,
		CreatedBy: &userID,
	}

	if err := s.repo.SaveDraft(draft); err != nil {
		return nil, fmt.Errorf("failed to save draft: %w", err)
	}

	return draft, nil
}

// SaveTemplate saves a league configuration as a reusable template
func (s *Service) SaveTemplate(orgID string, userID string, name string, draftData DraftData) (*LeagueDraft, error) {
	if draftData == nil || len(draftData) == 0 {
		return nil, fmt.Errorf("draft data cannot be empty")
	}

	if name == "" {
		return nil, fmt.Errorf("template name is required")
	}

	template := &LeagueDraft{
		OrgID:     orgID,
		Type:      DraftTypeTemplate,
		Name:      &name,
		DraftData: draftData,
		CreatedBy: &userID,
	}

	if err := s.repo.SaveDraft(template); err != nil {
		return nil, fmt.Errorf("failed to save template: %w", err)
	}

	return template, nil
}

// GetTemplatesByOrgID retrieves all templates for an organization
func (s *Service) GetTemplatesByOrgID(orgID string) ([]LeagueDraft, error) {
	return s.repo.GetTemplatesByOrgID(orgID)
}

// GetDraftsByOrgID retrieves all drafts for an organization
func (s *Service) GetDraftsByOrgID(orgID string) ([]LeagueDraft, error) {
	return s.repo.GetDraftsByOrgID(orgID)
}

// UpdateTemplate updates an existing template
func (s *Service) UpdateTemplate(templateID int, orgID string, name string, draftData DraftData) (*LeagueDraft, error) {
	if name == "" {
		return nil, fmt.Errorf("template name is required")
	}

	if draftData == nil || len(draftData) == 0 {
		return nil, fmt.Errorf("draft data cannot be empty")
	}

	template := &LeagueDraft{
		ID:        templateID,
		OrgID:     orgID,
		Name:      &name,
		DraftData: draftData,
		Type:      DraftTypeTemplate,
	}

	if err := s.repo.UpdateTemplate(template); err != nil {
		return nil, fmt.Errorf("failed to update template: %w", err)
	}

	return template, nil
}

// DeleteTemplate deletes a template
func (s *Service) DeleteTemplate(templateID int, orgID string) error {
	return s.repo.DeleteTemplate(templateID, orgID)
}

// DeleteDraftByID deletes a specific draft by ID for an organization
func (s *Service) DeleteDraftByID(draftID int, orgID string) error {
	return s.repo.DeleteDraftByID(draftID, orgID)
}

// GetAllDrafts retrieves all league drafts across all organizations (admin only)
func (s *Service) GetAllDrafts() ([]LeagueDraft, error) {
	return s.repo.GetAllDrafts()
}

// GetAllTemplates retrieves all templates across all organizations (admin only)
func (s *Service) GetAllTemplates() ([]LeagueDraft, error) {
	return s.repo.GetAllTemplates()
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
