package leagues

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RepositoryInterface defines the contract for repository implementations
type RepositoryInterface interface {
	// League methods
	GetAll() ([]League, error)
	GetAllApproved() ([]League, error)
	GetByID(id int) (*League, error)
	GetByOrgID(orgID string) ([]League, error)
	GetByOrgIDAndStatus(orgID string, status LeagueStatus) ([]League, error)
	Create(league *League) error
	GetPending() ([]League, error)
	GetPendingWithPagination(limit, offset int) ([]League, int64, error)
	GetAllWithPagination(limit, offset int) ([]League, int64, error)
	UpdateStatus(id int, status LeagueStatus, rejectionReason *string) error
	UpdateLeague(league *League) error
	ApproveLeagueWithTransaction(id int, sportID *int, venueID *int) error

	// Draft methods
	GetDraftByOrgID(orgID string) (*LeagueDraft, error)
	GetDraftByID(draftID int) (*LeagueDraft, error)
	SaveDraft(draft *LeagueDraft) error
	DeleteDraftByID(draftID int, orgID string) error
	GetAllDrafts() ([]LeagueDraft, error)
	GetDraftsByOrgID(orgID string) ([]LeagueDraft, error)
	GetTemplatesByOrgID(orgID string) ([]LeagueDraft, error)
	GetAllTemplates() ([]LeagueDraft, error)
	UpdateTemplate(template *LeagueDraft) error
	DeleteTemplate(templateID int, orgID string) error
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ============= LEAGUE METHODS =============

// GetAll retrieves all leagues regardless of status (admin only)
func (r *Repository) GetAll() ([]League, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, supplemental_requests, draft_data, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		ORDER BY
		  CASE
		    WHEN status = 'pending' THEN 1
		    WHEN status = 'approved' THEN 2
		    WHEN status = 'rejected' THEN 3
		  END,
		  created_at DESC
	`

	return r.scanLeagues(ctx, query)
}

// GetAllApproved retrieves all approved leagues
func (r *Repository) GetAllApproved() ([]League, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, supplemental_requests, draft_data, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		WHERE status = $1
		ORDER BY created_at DESC
	`

	return r.scanLeaguesWithParams(ctx, query, LeagueStatusApproved.String())
}

// GetByID retrieves a league by ID (any status - auth required at route level)
func (r *Repository) GetByID(id int) (*League, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	league := &League{}
	var gameOccurrencesJSON []byte
	var supplementalRequestsJSON []byte

	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, supplemental_requests, draft_data, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		WHERE id = $1
	`

	var draftDataJSON []byte
	err := r.db.QueryRow(ctx, query, id).Scan(
		&league.ID,
		&league.OrgID,
		&league.SportID,
		&league.LeagueName,
		&league.Division,
		&league.RegistrationDeadline,
		&league.SeasonStartDate,
		&league.SeasonEndDate,
		&gameOccurrencesJSON,
		&league.PricingStrategy,
		&league.PricingAmount,
		&league.PricingPerPlayer,
		&league.VenueID,
		&league.Gender,
		&league.SeasonDetails,
		&league.RegistrationURL,
		&league.Duration,
		&league.MinimumTeamPlayers,
		&league.PerGameFee,
		&supplementalRequestsJSON,
		&draftDataJSON,
		&league.Status,
		&league.CreatedAt,
		&league.UpdatedAt,
		&league.CreatedBy,
		&league.RejectionReason,
	)

	if err != nil {
		return nil, fmt.Errorf("league not found")
	}

	if err := json.Unmarshal(gameOccurrencesJSON, &league.GameOccurrences); err != nil {
		return nil, fmt.Errorf("failed to parse game occurrences: %w", err)
	}

	if len(supplementalRequestsJSON) > 0 {
		if err := json.Unmarshal(supplementalRequestsJSON, &league.SupplementalRequests); err != nil {
			return nil, fmt.Errorf("failed to parse supplemental requests: %w", err)
		}
	}

	if len(draftDataJSON) > 0 {
		if err := json.Unmarshal(draftDataJSON, &league.DraftData); err != nil {
			return nil, fmt.Errorf("failed to parse draft data: %w", err)
		}
	}

	return league, nil
}

// GetByOrgID retrieves all leagues for an organization (all statuses)
func (r *Repository) GetByOrgID(orgID string) ([]League, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, supplemental_requests, draft_data, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		WHERE org_id = $1
		ORDER BY
		  CASE
		    WHEN status = 'pending' THEN 1
		    WHEN status = 'approved' THEN 2
		    WHEN status = 'rejected' THEN 3
		  END,
		  created_at DESC
	`

	return r.scanLeaguesWithParams(ctx, query, orgID)
}

// GetByOrgIDAndStatus retrieves leagues for an organization filtered by status
func (r *Repository) GetByOrgIDAndStatus(orgID string, status LeagueStatus) ([]League, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, supplemental_requests, draft_data, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		WHERE org_id = $1 AND status = $2
		ORDER BY created_at DESC
	`

	return r.scanLeaguesWithParams(ctx, query, orgID, status.String())
}

// Create creates a new league in the database
func (r *Repository) Create(league *League) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	gameOccurrencesJSON, err := json.Marshal(league.GameOccurrences)
	if err != nil {
		return fmt.Errorf("failed to marshal game occurrences: %w", err)
	}

	var supplementalRequestsJSON []byte
	if league.SupplementalRequests != nil {
		supplementalRequestsJSON, err = json.Marshal(league.SupplementalRequests)
		if err != nil {
			return fmt.Errorf("failed to marshal supplemental requests: %w", err)
		}
	}

	// Marshal draft_data
	var draftDataJSON []byte
	if len(league.DraftData) > 0 {
		var err error
		draftDataJSON, err = json.Marshal(league.DraftData)
		if err != nil {
			return fmt.Errorf("failed to marshal draft data: %w", err)
		}
	}

	query := `
		INSERT INTO leagues (org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		                     season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		                     venue_id, gender, season_details, registration_url, duration,
		                     minimum_team_players, per_game_fee, supplemental_requests, draft_data, status, created_at, updated_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
		RETURNING id
	`

	err = r.db.QueryRow(
		ctx,
		query,
		*league.OrgID,
		league.SportID,
		league.LeagueName,
		league.Division,
		league.RegistrationDeadline,
		league.SeasonStartDate,
		league.SeasonEndDate,
		gameOccurrencesJSON,
		league.PricingStrategy,
		league.PricingAmount,
		league.PricingPerPlayer,
		league.VenueID,
		league.Gender,
		league.SeasonDetails,
		league.RegistrationURL,
		league.Duration,
		league.MinimumTeamPlayers,
		league.PerGameFee,
		supplementalRequestsJSON,
		draftDataJSON,
		league.Status,
		time.Now(),
		time.Now(),
		*league.CreatedBy,
	).Scan(&league.ID)

	if err != nil {
		return fmt.Errorf("failed to create league: %w", err)
	}

	league.CreatedAt = time.Now()
	league.UpdatedAt = time.Now()

	return nil
}

// GetPending retrieves all pending league submissions
func (r *Repository) GetPending() ([]League, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, supplemental_requests, draft_data, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		WHERE status = $1
		ORDER BY created_at ASC
	`

	return r.scanLeaguesWithParams(ctx, query, LeagueStatusPending.String())
}

// GetPendingWithPagination retrieves pending leagues with limit and offset for pagination
func (r *Repository) GetPendingWithPagination(limit, offset int) ([]League, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get total count
	countQuery := `SELECT COUNT(*) FROM leagues WHERE status = $1`
	var total int64
	if err := r.db.QueryRow(ctx, countQuery, LeagueStatusPending.String()).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Get paginated results using the standard scanLeaguesWithParams helper
	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, supplemental_requests, draft_data, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		WHERE status = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	leagues, err := r.scanLeaguesWithParams(ctx, query, LeagueStatusPending.String(), limit, offset)
	if err != nil {
		return nil, 0, err
	}

	return leagues, total, nil
}

// GetAllWithPagination retrieves all leagues regardless of status with limit and offset for pagination
func (r *Repository) GetAllWithPagination(limit, offset int) ([]League, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get total count
	countQuery := `SELECT COUNT(*) FROM leagues`
	var total int64
	if err := r.db.QueryRow(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Get paginated results with status-based ordering
	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, supplemental_requests, draft_data, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		ORDER BY
		  CASE
		    WHEN status = 'pending' THEN 1
		    WHEN status = 'approved' THEN 2
		    WHEN status = 'rejected' THEN 3
		  END,
		  created_at DESC
		LIMIT $1 OFFSET $2
	`

	leagues, err := r.scanLeaguesWithParams(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	return leagues, total, nil
}

// UpdateStatus updates the status of a league
func (r *Repository) UpdateStatus(id int, status LeagueStatus, rejectionReason *string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE leagues
		SET status = $1, rejection_reason = $2, updated_at = NOW()
		WHERE id = $3
	`

	result, err := r.db.Exec(ctx, query, status.String(), rejectionReason, id)
	if err != nil {
		return fmt.Errorf("failed to update league status: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("league not found")
	}

	return nil
}

// UpdateLeague updates an existing league (used when approving with new sport/venue IDs)
func (r *Repository) UpdateLeague(league *League) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var supplementalRequestsJSON []byte
	if league.SupplementalRequests != nil {
		var err error
		supplementalRequestsJSON, err = json.Marshal(league.SupplementalRequests)
		if err != nil {
			return fmt.Errorf("failed to marshal supplemental requests: %w", err)
		}
	}

	query := `
		UPDATE leagues
		SET sport_id = $1, venue_id = $2, supplemental_requests = $3, updated_at = NOW()
		WHERE id = $4
	`

	result, err := r.db.Exec(ctx, query, league.SportID, league.VenueID, supplementalRequestsJSON, league.ID)
	if err != nil {
		return fmt.Errorf("failed to update league: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("league not found")
	}

	return nil
}

// ApproveLeagueWithTransaction atomically updates sport_id, venue_id, and status to approved
// Wraps all updates in a single transaction to ensure consistency
func (r *Repository) ApproveLeagueWithTransaction(id int, sportID *int, venueID *int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Start a transaction
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Ensure transaction is rolled back if we return early with an error
	defer tx.Rollback(ctx)

	// Update sport_id and venue_id if they changed
	if sportID != nil || venueID != nil {
		updateQuery := `
			UPDATE leagues
			SET sport_id = COALESCE($1, sport_id),
				venue_id = COALESCE($2, venue_id),
				updated_at = NOW()
			WHERE id = $3
		`

		result, err := tx.Exec(ctx, updateQuery, sportID, venueID, id)
		if err != nil {
			return fmt.Errorf("failed to update league IDs: %w", err)
		}

		if result.RowsAffected() == 0 {
			return fmt.Errorf("league not found")
		}
	}

	// Update status to approved
	statusQuery := `
		UPDATE leagues
		SET status = $1, rejection_reason = NULL, updated_at = NOW()
		WHERE id = $2
	`

	result, err := tx.Exec(ctx, statusQuery, LeagueStatusApproved.String(), id)
	if err != nil {
		return fmt.Errorf("failed to update league status: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("league not found")
	}

	// Commit the transaction
	if err = tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// ============= DRAFT METHODS =============

// GetDraftByOrgID retrieves the draft for an organization
func (r *Repository) GetDraftByOrgID(orgID string) (*LeagueDraft, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	draft := &LeagueDraft{}
	var draftDataJSON []byte

	query := `
		SELECT id, org_id, draft_data, created_at, updated_at, created_by
		FROM leagues_drafts
		WHERE org_id = $1
	`

	err := r.db.QueryRow(ctx, query, orgID).Scan(
		&draft.ID,
		&draft.OrgID,
		&draftDataJSON,
		&draft.CreatedAt,
		&draft.UpdatedAt,
		&draft.CreatedBy,
	)

	if err != nil {
		return nil, nil // Return nil if no draft found (not an error)
	}

	if err := json.Unmarshal(draftDataJSON, &draft.DraftData); err != nil {
		return nil, fmt.Errorf("failed to parse draft data: %w", err)
	}

	return draft, nil
}

// GetDraftByID retrieves a draft by its ID
func (r *Repository) GetDraftByID(draftID int) (*LeagueDraft, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	draft := &LeagueDraft{}
	var draftDataJSON []byte

	query := `
		SELECT id, org_id, type, name, draft_data, created_at, updated_at, created_by
		FROM leagues_drafts
		WHERE id = $1
	`

	err := r.db.QueryRow(ctx, query, draftID).Scan(
		&draft.ID,
		&draft.OrgID,
		&draft.Type,
		&draft.Name,
		&draftDataJSON,
		&draft.CreatedAt,
		&draft.UpdatedAt,
		&draft.CreatedBy,
	)

	if err != nil {
		return nil, fmt.Errorf("draft not found")
	}

	if err := json.Unmarshal(draftDataJSON, &draft.DraftData); err != nil {
		return nil, fmt.Errorf("failed to parse draft data: %w", err)
	}

	return draft, nil
}

// SaveDraft saves or updates a draft for an organization
func (r *Repository) SaveDraft(draft *LeagueDraft) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	draftDataJSON, err := json.Marshal(draft.DraftData)
	if err != nil {
		return fmt.Errorf("failed to marshal draft data: %w", err)
	}

	// If draft has an ID, update it; otherwise insert a new one
	if draft.ID > 0 {
		// Update existing draft
		query := `
			UPDATE leagues_drafts
			SET draft_data = $1, updated_at = NOW()
			WHERE id = $2 AND org_id = $3 AND type = 'draft'
		`

		result, err := r.db.Exec(ctx, query, draftDataJSON, draft.ID, draft.OrgID)
		if err != nil {
			return fmt.Errorf("failed to update draft: %w", err)
		}

		if result.RowsAffected() == 0 {
			return fmt.Errorf("draft not found or access denied")
		}

		return nil
	}

	// Insert new draft
	// Each save creates a new row, allowing users to have multiple drafts per organization
	query := `
		INSERT INTO leagues_drafts (org_id, type, name, draft_data, created_at, updated_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`

	err = r.db.QueryRow(
		ctx,
		query,
		draft.OrgID,
		draft.Type,
		draft.Name,
		draftDataJSON,
		time.Now(),
		time.Now(),
		draft.CreatedBy,
	).Scan(&draft.ID)

	if err != nil {
		return fmt.Errorf("failed to save draft: %w", err)
	}

	return nil
}

// DeleteDraftByID deletes a draft by ID for a specific organization
func (r *Repository) DeleteDraftByID(draftID int, orgID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `DELETE FROM leagues_drafts WHERE id = $1 AND org_id = $2 AND type = 'draft'`

	result, err := r.db.Exec(ctx, query, draftID, orgID)
	if err != nil {
		return fmt.Errorf("failed to delete draft: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("draft not found")
	}

	return nil
}

// GetAllDrafts retrieves all league drafts across all organizations (admin only)
func (r *Repository) GetAllDrafts() ([]LeagueDraft, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, draft_data, created_at, updated_at, created_by
		FROM leagues_drafts
		ORDER BY updated_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query drafts: %w", err)
	}
	defer rows.Close()

	var drafts []LeagueDraft
	for rows.Next() {
		var draft LeagueDraft
		var draftDataJSON []byte

		err := rows.Scan(
			&draft.ID,
			&draft.OrgID,
			&draftDataJSON,
			&draft.CreatedAt,
			&draft.UpdatedAt,
			&draft.CreatedBy,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan draft: %w", err)
		}

		if err := json.Unmarshal(draftDataJSON, &draft.DraftData); err != nil {
			return nil, fmt.Errorf("failed to parse draft data: %w", err)
		}

		drafts = append(drafts, draft)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return drafts, nil
}

// GetDraftsByOrgID retrieves all drafts for a specific organization
func (r *Repository) GetDraftsByOrgID(orgID string) ([]LeagueDraft, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, type, name, draft_data, created_at, updated_at, created_by
		FROM leagues_drafts
		WHERE org_id = $1 AND type = 'draft'
		ORDER BY updated_at DESC
	`

	rows, err := r.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, fmt.Errorf("failed to query drafts: %w", err)
	}
	defer rows.Close()

	var drafts []LeagueDraft
	for rows.Next() {
		var draft LeagueDraft
		var draftDataJSON []byte

		err := rows.Scan(
			&draft.ID,
			&draft.OrgID,
			&draft.Type,
			&draft.Name,
			&draftDataJSON,
			&draft.CreatedAt,
			&draft.UpdatedAt,
			&draft.CreatedBy,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan draft: %w", err)
		}

		if err := json.Unmarshal(draftDataJSON, &draft.DraftData); err != nil {
			return nil, fmt.Errorf("failed to parse draft data: %w", err)
		}

		drafts = append(drafts, draft)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return drafts, nil
}

// GetTemplatesByOrgID retrieves all templates for a specific organization
func (r *Repository) GetTemplatesByOrgID(orgID string) ([]LeagueDraft, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, type, name, draft_data, created_at, updated_at, created_by
		FROM leagues_drafts
		WHERE org_id = $1 AND type = 'template'
		ORDER BY updated_at DESC
	`

	rows, err := r.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, fmt.Errorf("failed to query templates: %w", err)
	}
	defer rows.Close()

	var templates []LeagueDraft
	for rows.Next() {
		var template LeagueDraft
		var draftDataJSON []byte

		err := rows.Scan(
			&template.ID,
			&template.OrgID,
			&template.Type,
			&template.Name,
			&draftDataJSON,
			&template.CreatedAt,
			&template.UpdatedAt,
			&template.CreatedBy,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}

		if err := json.Unmarshal(draftDataJSON, &template.DraftData); err != nil {
			return nil, fmt.Errorf("failed to parse template data: %w", err)
		}

		templates = append(templates, template)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return templates, nil
}

// GetAllTemplates retrieves all templates across all organizations (admin only)
func (r *Repository) GetAllTemplates() ([]LeagueDraft, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, type, name, draft_data, created_at, updated_at, created_by
		FROM leagues_drafts
		WHERE type = 'template'
		ORDER BY updated_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query templates: %w", err)
	}
	defer rows.Close()

	var templates []LeagueDraft
	for rows.Next() {
		var template LeagueDraft
		var draftDataJSON []byte

		err := rows.Scan(
			&template.ID,
			&template.OrgID,
			&template.Type,
			&template.Name,
			&draftDataJSON,
			&template.CreatedAt,
			&template.UpdatedAt,
			&template.CreatedBy,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}

		if err := json.Unmarshal(draftDataJSON, &template.DraftData); err != nil {
			return nil, fmt.Errorf("failed to parse template data: %w", err)
		}

		templates = append(templates, template)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return templates, nil
}

// UpdateTemplate updates an existing template (with org_id validation)
func (r *Repository) UpdateTemplate(template *LeagueDraft) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	draftDataJSON, err := json.Marshal(template.DraftData)
	if err != nil {
		return fmt.Errorf("failed to marshal draft data: %w", err)
	}

	query := `
		UPDATE leagues_drafts
		SET name = $1, draft_data = $2, updated_at = NOW()
		WHERE id = $3 AND org_id = $4 AND type = 'template'
	`

	result, err := r.db.Exec(ctx, query, template.Name, draftDataJSON, template.ID, template.OrgID)
	if err != nil {
		return fmt.Errorf("failed to update template: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("template not found or access denied")
	}

	return nil
}

// DeleteTemplate deletes a template (with org_id validation)
func (r *Repository) DeleteTemplate(templateID int, orgID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `DELETE FROM leagues_drafts WHERE id = $1 AND org_id = $2 AND type = 'template'`

	result, err := r.db.Exec(ctx, query, templateID, orgID)
	if err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("template not found or access denied")
	}

	return nil
}

// ============= HELPER METHODS =============

// scanLeagues scans leagues from query results
func (r *Repository) scanLeagues(ctx context.Context, query string, args ...interface{}) ([]League, error) {
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query leagues: %w", err)
	}
	defer rows.Close()

	var leagues []League
	for rows.Next() {
		var league League
		var gameOccurrencesJSON []byte
		var supplementalRequestsJSON []byte
		var draftDataJSON []byte

		err := rows.Scan(
			&league.ID,
			&league.OrgID,
			&league.SportID,
			&league.LeagueName,
			&league.Division,
			&league.RegistrationDeadline,
			&league.SeasonStartDate,
			&league.SeasonEndDate,
			&gameOccurrencesJSON,
			&league.PricingStrategy,
			&league.PricingAmount,
			&league.PricingPerPlayer,
			&league.VenueID,
			&league.Gender,
			&league.SeasonDetails,
			&league.RegistrationURL,
			&league.Duration,
			&league.MinimumTeamPlayers,
			&league.PerGameFee,
			&supplementalRequestsJSON,
			&draftDataJSON,
			&league.Status,
			&league.CreatedAt,
			&league.UpdatedAt,
			&league.CreatedBy,
			&league.RejectionReason,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan league: %w", err)
		}

		if err := json.Unmarshal(gameOccurrencesJSON, &league.GameOccurrences); err != nil {
			return nil, fmt.Errorf("failed to parse game occurrences: %w", err)
		}

		if len(supplementalRequestsJSON) > 0 {
			if err := json.Unmarshal(supplementalRequestsJSON, &league.SupplementalRequests); err != nil {
				return nil, fmt.Errorf("failed to parse supplemental requests: %w", err)
			}
		}

		if len(draftDataJSON) > 0 {
			if err := json.Unmarshal(draftDataJSON, &league.DraftData); err != nil {
				return nil, fmt.Errorf("failed to parse draft data: %w", err)
			}
		}

		leagues = append(leagues, league)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return leagues, nil
}

// scanLeaguesWithParams is a helper to scan with parameters
func (r *Repository) scanLeaguesWithParams(ctx context.Context, query string, params ...interface{}) ([]League, error) {
	return r.scanLeagues(ctx, query, params...)
}
