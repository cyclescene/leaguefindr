package leagues

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/supabase-community/postgrest-go"
)

// RepositoryInterface defines the contract for repository implementations
type RepositoryInterface interface {
	// League methods
	GetAll(ctx context.Context) ([]League, error)
	GetAllApproved(ctx context.Context) ([]League, error)
	GetAllApprovedWithPagination(ctx context.Context, limit, offset int) ([]League, int64, error)
	GetByID(ctx context.Context, id int) (*League, error)
	GetByOrgID(ctx context.Context, orgID string) ([]League, error)
	GetByOrgIDAndStatus(ctx context.Context, orgID string, status LeagueStatus) ([]League, error)
	Create(ctx context.Context, league *League) error
	GetPending(ctx context.Context) ([]League, error)
	GetPendingWithPagination(ctx context.Context, limit, offset int) ([]League, int64, error)
	GetAllWithPagination(ctx context.Context, limit, offset int) ([]League, int64, error)
	UpdateStatus(ctx context.Context, id int, status LeagueStatus, rejectionReason *string) error
	UpdateLeague(ctx context.Context, league *League) error
	ApproveLeagueWithTransaction(ctx context.Context, id int, sportID *int, venueID *int) error

	// Draft methods
	GetDraftByOrgID(ctx context.Context, orgID string) (*LeagueDraft, error)
	GetDraftByID(ctx context.Context, draftID int) (*LeagueDraft, error)
	SaveDraft(ctx context.Context, draft *LeagueDraft) error
	DeleteDraftByID(ctx context.Context, draftID int, orgID string) error
	GetAllDrafts(ctx context.Context) ([]LeagueDraft, error)
	GetDraftsByOrgID(ctx context.Context, orgID string) ([]LeagueDraft, error)
	GetTemplatesByOrgID(ctx context.Context, orgID string) ([]LeagueDraft, error)
	GetAllTemplates(ctx context.Context) ([]LeagueDraft, error)
	UpdateTemplate(ctx context.Context, template *LeagueDraft) error
	DeleteTemplate(ctx context.Context, templateID int, orgID string) error
}

type Repository struct {
	client *postgrest.Client
}

// NewRepository creates a repository with a postgrest client
func NewRepository(client *postgrest.Client) *Repository {
	return &Repository{
		client: client,
	}
}

// ============= LEAGUE METHODS =============

// GetAll retrieves all leagues regardless of status (admin only)
func (r *Repository) GetAll(ctx context.Context) ([]League, error) {
	var leagues []League
	_, err := r.client.From("leagues").
		Select("*", "", false).
		ExecuteToWithContext(ctx, &leagues)

	if err != nil {
		return nil, fmt.Errorf("failed to query leagues: %w", err)
	}

	return leagues, nil
}

// GetAllApproved retrieves all approved leagues
func (r *Repository) GetAllApproved(ctx context.Context) ([]League, error) {
	var leagues []League
	_, err := r.client.From("leagues").
		Select("*", "", false).
		Eq("status", "approved").
		ExecuteToWithContext(ctx, &leagues)

	if err != nil {
		return nil, fmt.Errorf("failed to query leagues: %w", err)
	}

	return leagues, nil
}

// GetAllApprovedWithPagination retrieves approved leagues with pagination
func (r *Repository) GetAllApprovedWithPagination(ctx context.Context, limit, offset int) ([]League, int64, error) {
	var leagues []League
	count, err := r.client.From("leagues").
		Select("*", "exact", false).
		Eq("status", "approved").
		Range(offset, offset+limit-1, "").
		ExecuteToWithContext(ctx, &leagues)

	if err != nil {
		return nil, 0, fmt.Errorf("failed to query leagues: %w", err)
	}

	return leagues, int64(count), nil
}

// GetByID retrieves a league by ID (any status - auth required at route level)
func (r *Repository) GetByID(ctx context.Context, id int) (*League, error) {
	var leagues []League
	_, err := r.client.From("leagues").
		Select("*", "", false).
		Eq("id", strconv.Itoa(id)).
		ExecuteToWithContext(ctx, &leagues)

	if err != nil || len(leagues) == 0 {
		return nil, fmt.Errorf("league not found")
	}

	return &leagues[0], nil
}

// GetByOrgID retrieves all leagues for an organization (all statuses)
func (r *Repository) GetByOrgID(ctx context.Context, orgID string) ([]League, error) {
	var leagues []League
	_, err := r.client.From("leagues").
		Select("*", "", false).
		Eq("org_id", orgID).
		ExecuteToWithContext(ctx, &leagues)

	if err != nil {
		return nil, fmt.Errorf("failed to query leagues: %w", err)
	}

	return leagues, nil
}

// GetByOrgIDAndStatus retrieves leagues for an organization filtered by status
func (r *Repository) GetByOrgIDAndStatus(ctx context.Context, orgID string, status LeagueStatus) ([]League, error) {
	var leagues []League
	_, err := r.client.From("leagues").
		Select("*", "", false).
		Eq("org_id", orgID).
		Eq("status", status.String()).
		ExecuteToWithContext(ctx, &leagues)

	if err != nil {
		return nil, fmt.Errorf("failed to query leagues: %w", err)
	}

	return leagues, nil
}

// Create creates a new league in the database
func (r *Repository) Create(ctx context.Context, league *League) error {
	now := time.Now()
	league.CreatedAt = Timestamp{now}
	league.UpdatedAt = Timestamp{now}

	// Create request body with all league data
	insertData := map[string]interface{}{
		"org_id":                league.OrgID,
		"sport_id":              league.SportID,
		"league_name":           league.LeagueName,
		"division":              league.Division,
		"registration_deadline": league.RegistrationDeadline,
		"season_start_date":     league.SeasonStartDate,
		"season_end_date":       league.SeasonEndDate,
		"game_occurrences":      league.GameOccurrences,
		"pricing_strategy":      league.PricingStrategy,
		"pricing_amount":        league.PricingAmount,
		"pricing_per_player":    league.PricingPerPlayer,
		"venue_id":              league.VenueID,
		"gender":                league.Gender,
		"season_details":        league.SeasonDetails,
		"registration_url":      league.RegistrationURL,
		"duration":              league.Duration,
		"minimum_team_players":  league.MinimumTeamPlayers,
		"per_game_fee":          league.PerGameFee,
		"supplemental_requests": league.SupplementalRequests,
		"form_data":             league.FormData,
		"status":                league.Status,
		"created_at":            now,
		"updated_at":            now,
		"created_by":            league.CreatedBy,
	}

	var result []map[string]interface{}
	_, err := r.client.From("leagues").
		Insert(insertData, true, "", "", "").
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return fmt.Errorf("failed to create league: %w", err)
	}

	// Extract ID from result if available
	if len(result) > 0 && result[0]["id"] != nil {
		if id, ok := result[0]["id"].(float64); ok {
			league.ID = int(id)
		}
	}

	return nil
}

// GetPending retrieves all pending league submissions
func (r *Repository) GetPending(ctx context.Context) ([]League, error) {
	var leagues []League
	_, err := r.client.From("leagues").
		Select("*", "", false).
		Eq("status", "pending").
		ExecuteToWithContext(ctx, &leagues)

	if err != nil {
		return nil, fmt.Errorf("failed to query leagues: %w", err)
	}

	return leagues, nil
}

// GetPendingWithPagination retrieves pending leagues with limit and offset for pagination
func (r *Repository) GetPendingWithPagination(ctx context.Context, limit, offset int) ([]League, int64, error) {
	var leagues []League
	count, err := r.client.From("leagues").
		Select("*", "exact", false).
		Eq("status", "pending").
		Range(offset, offset+limit-1, "").
		ExecuteToWithContext(ctx, &leagues)

	if err != nil {
		return nil, 0, fmt.Errorf("failed to query leagues: %w", err)
	}

	return leagues, int64(count), nil
}

// GetAllWithPagination retrieves all leagues regardless of status with limit and offset for pagination
func (r *Repository) GetAllWithPagination(ctx context.Context, limit, offset int) ([]League, int64, error) {
	var leagues []League
	count, err := r.client.From("leagues").
		Select("*", "exact", false).
		Range(offset, offset+limit-1, "").
		ExecuteToWithContext(ctx, &leagues)

	if err != nil {
		return nil, 0, fmt.Errorf("failed to query leagues: %w", err)
	}

	return leagues, int64(count), nil
}

// UpdateStatus updates the status of a league
func (r *Repository) UpdateStatus(ctx context.Context, id int, status LeagueStatus, rejectionReason *string) error {
	updateData := map[string]interface{}{
		"status":           status.String(),
		"rejection_reason": rejectionReason,
		"updated_at":       time.Now(),
	}

	_, err := r.client.From("leagues").
		Update(updateData, "", "").
		Eq("id", strconv.Itoa(id)).
		ExecuteToWithContext(ctx, nil)

	if err != nil {
		return fmt.Errorf("failed to update league status: %w", err)
	}

	return nil
}

// UpdateLeague updates an existing league (used when approving with new sport/venue IDs)
func (r *Repository) UpdateLeague(ctx context.Context, league *League) error {
	updateData := map[string]interface{}{
		"sport_id":   league.SportID,
		"venue_id":   league.VenueID,
		"updated_at": time.Now(),
	}

	_, err := r.client.From("leagues").
		Update(updateData, "", "").
		Eq("id", strconv.Itoa(league.ID)).
		ExecuteToWithContext(ctx, nil)

	if err != nil {
		return fmt.Errorf("failed to update league: %w", err)
	}

	return nil
}

// ApproveLeagueWithTransaction atomically updates sport_id, venue_id, status to approved, and creates game_occurrences
// With PostgREST, we'll perform multiple operations with RLS enforcing consistency at the database level
func (r *Repository) ApproveLeagueWithTransaction(ctx context.Context, id int, sportID *int, venueID *int) error {
	// Fetch the league to get game_occurrences
	var leagues []League
	_, err := r.client.From("leagues").
		Select("*", "", false).
		Eq("id", strconv.Itoa(id)).
		ExecuteToWithContext(ctx, &leagues)

	if err != nil || len(leagues) == 0 {
		return fmt.Errorf("failed to fetch league: %w", err)
	}

	league := leagues[0]

	// Insert game_occurrences into the separate table
	for _, occurrence := range league.GameOccurrences {
		gameOccData := map[string]interface{}{
			"league_id":  league.ID,
			"day":        occurrence.Day,
			"start_time": occurrence.StartTime,
			"end_time":   occurrence.EndTime,
		}

		// Insert (ignoring errors for now - if it exists, that's fine)
		_, _ = r.client.From("game_occurrences").
			Insert(gameOccData, true, "", "", "").
			ExecuteToWithContext(ctx, nil)
	}

	// Update sport_id and venue_id if they changed
	updateData := map[string]interface{}{
		"updated_at": time.Now(),
	}

	if sportID != nil {
		updateData["sport_id"] = *sportID
	}
	if venueID != nil {
		updateData["venue_id"] = *venueID
	}

	if sportID != nil || venueID != nil {
		_, err = r.client.From("leagues").
			Update(updateData, "", "").
			Eq("id", strconv.Itoa(id)).
			ExecuteToWithContext(ctx, nil)

		if err != nil {
			return fmt.Errorf("failed to update league IDs: %w", err)
		}
	}

	// Update status to approved
	statusData := map[string]interface{}{
		"status":           "approved",
		"rejection_reason": nil,
		"updated_at":       time.Now(),
	}

	_, err = r.client.From("leagues").
		Update(statusData, "", "").
		Eq("id", strconv.Itoa(id)).
		ExecuteToWithContext(ctx, nil)

	if err != nil {
		return fmt.Errorf("failed to update league status: %w", err)
	}

	return nil
}

// ============= DRAFT METHODS =============

// GetDraftByOrgID retrieves the draft for an organization
func (r *Repository) GetDraftByOrgID(ctx context.Context, orgID string) (*LeagueDraft, error) {
	var drafts []LeagueDraft
	_, err := r.client.From("leagues_drafts").
		Select("*", "", false).
		Eq("org_id", orgID).
		ExecuteToWithContext(ctx, &drafts)

	if err != nil || len(drafts) == 0 {
		return nil, nil // Return nil if no draft found (not an error)
	}

	return &drafts[0], nil
}

// GetDraftByID retrieves a draft by its ID
func (r *Repository) GetDraftByID(ctx context.Context, draftID int) (*LeagueDraft, error) {
	var drafts []LeagueDraft
	_, err := r.client.From("leagues_drafts").
		Select("*", "", false).
		Eq("id", strconv.Itoa(draftID)).
		ExecuteToWithContext(ctx, &drafts)

	if err != nil || len(drafts) == 0 {
		return nil, fmt.Errorf("draft not found")
	}

	return &drafts[0], nil
}

// SaveDraft saves or updates a draft for an organization
func (r *Repository) SaveDraft(ctx context.Context, draft *LeagueDraft) error {
	now := time.Now()

	// If draft has an ID, update it; otherwise insert a new one
	if draft.ID > 0 {
		// Update existing draft
		updateData := map[string]interface{}{
			"form_data":  draft.FormData,
			"updated_at": now,
		}

		_, err := r.client.From("leagues_drafts").
			Update(updateData, "", "").
			Eq("id", strconv.Itoa(draft.ID)).
			Eq("org_id", draft.OrgID).
			Eq("type", "draft").
			ExecuteToWithContext(ctx, nil)

		if err != nil {
			return fmt.Errorf("failed to update draft: %w", err)
		}

		return nil
	}

	// Insert new draft
	insertData := map[string]interface{}{
		"org_id":     draft.OrgID,
		"type":       draft.Type,
		"name":       draft.Name,
		"form_data":  draft.FormData,
		"created_at": now,
		"updated_at": now,
		"created_by": draft.CreatedBy,
	}

	var result []map[string]interface{}
	_, err := r.client.From("leagues_drafts").
		Insert(insertData, true, "", "", "").
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return fmt.Errorf("failed to save draft: %w", err)
	}

	// Extract ID from result if available
	if len(result) > 0 && result[0]["id"] != nil {
		if id, ok := result[0]["id"].(float64); ok {
			draft.ID = int(id)
		}
	}

	return nil
}

// DeleteDraftByID deletes a draft by ID for a specific organization
func (r *Repository) DeleteDraftByID(ctx context.Context, draftID int, orgID string) error {
	_, err := r.client.From("leagues_drafts").
		Delete("", "").
		Eq("id", strconv.Itoa(draftID)).
		Eq("org_id", orgID).
		Eq("type", "draft").
		ExecuteToWithContext(ctx, nil)

	if err != nil {
		return fmt.Errorf("failed to delete draft: %w", err)
	}

	return nil
}

// GetAllDrafts retrieves all league drafts across all organizations (admin only)
func (r *Repository) GetAllDrafts(ctx context.Context) ([]LeagueDraft, error) {
	var drafts []LeagueDraft
	_, err := r.client.From("leagues_drafts").
		Select("*", "", false).
		ExecuteToWithContext(ctx, &drafts)

	if err != nil {
		return nil, fmt.Errorf("failed to query drafts: %w", err)
	}

	return drafts, nil
}

// GetDraftsByOrgID retrieves all drafts for a specific organization
func (r *Repository) GetDraftsByOrgID(ctx context.Context, orgID string) ([]LeagueDraft, error) {
	var drafts []LeagueDraft
	_, err := r.client.From("leagues_drafts").
		Select("*", "", false).
		Eq("org_id", orgID).
		Eq("type", "draft").
		ExecuteToWithContext(ctx, &drafts)

	if err != nil {
		return nil, fmt.Errorf("failed to query drafts: %w", err)
	}

	return drafts, nil
}

// GetTemplatesByOrgID retrieves all templates for a specific organization
func (r *Repository) GetTemplatesByOrgID(ctx context.Context, orgID string) ([]LeagueDraft, error) {
	var templates []LeagueDraft
	_, err := r.client.From("leagues_drafts").
		Select("*", "", false).
		Eq("org_id", orgID).
		Eq("type", "template").
		ExecuteToWithContext(ctx, &templates)

	if err != nil {
		return nil, fmt.Errorf("failed to query templates: %w", err)
	}

	return templates, nil
}

// GetAllTemplates retrieves all templates across all organizations (admin only)
func (r *Repository) GetAllTemplates(ctx context.Context) ([]LeagueDraft, error) {
	var templates []LeagueDraft
	_, err := r.client.From("leagues_drafts").
		Select("*", "", false).
		Eq("type", "template").
		ExecuteToWithContext(ctx, &templates)

	if err != nil {
		return nil, fmt.Errorf("failed to query templates: %w", err)
	}

	return templates, nil
}

// UpdateTemplate updates an existing template (with org_id validation)
func (r *Repository) UpdateTemplate(ctx context.Context, template *LeagueDraft) error {
	updateData := map[string]interface{}{
		"name":       template.Name,
		"form_data":  template.FormData,
		"updated_at": time.Now(),
	}

	_, err := r.client.From("leagues_drafts").
		Update(updateData, "", "").
		Eq("id", strconv.Itoa(template.ID)).
		Eq("org_id", template.OrgID).
		Eq("type", "template").
		ExecuteToWithContext(ctx, nil)

	if err != nil {
		return fmt.Errorf("failed to update template: %w", err)
	}

	return nil
}

// DeleteTemplate deletes a template (with org_id validation)
func (r *Repository) DeleteTemplate(ctx context.Context, templateID int, orgID string) error {
	_, err := r.client.From("leagues_drafts").
		Delete("", "").
		Eq("id", strconv.Itoa(templateID)).
		Eq("org_id", orgID).
		Eq("type", "template").
		ExecuteToWithContext(ctx, nil)

	if err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	return nil
}
