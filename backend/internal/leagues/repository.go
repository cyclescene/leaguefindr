package leagues

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RepositoryInterface defines the contract for repository implementations
type RepositoryInterface interface {
	// League methods
	GetAll() ([]League, error)
	GetAllApproved() ([]League, error)
	GetByID(id int) (*League, error)
	GetByOrgID(orgID int) ([]League, error)
	GetByOrgIDAndStatus(orgID int, status LeagueStatus) ([]League, error)
	Create(league *League) error
	GetPending() ([]League, error)
	UpdateStatus(id int, status LeagueStatus, rejectionReason *string) error

	// Draft methods
	GetDraftByOrgID(orgID int) (*LeagueDraft, error)
	SaveDraft(draft *LeagueDraft) error
	DeleteDraft(orgID int) error
	GetAllDrafts() ([]LeagueDraft, error)
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
		       venue_id, age_group, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, status, created_at, updated_at, created_by,
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
		       venue_id, age_group, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		WHERE status = $1
		ORDER BY created_at DESC
	`

	return r.scanLeaguesWithParams(ctx, query, LeagueStatusApproved.String())
}

// GetByID retrieves a league by ID (approved only)
func (r *Repository) GetByID(id int) (*League, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	league := &League{}
	var gameOccurrencesJSON []byte

	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, age_group, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		WHERE id = $1 AND status = $2
	`

	err := r.db.QueryRow(ctx, query, id, LeagueStatusApproved.String()).Scan(
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
		&league.AgeGroup,
		&league.Gender,
		&league.SeasonDetails,
		&league.RegistrationURL,
		&league.Duration,
		&league.MinimumTeamPlayers,
		&league.PerGameFee,
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

	return league, nil
}

// GetByOrgID retrieves all leagues for an organization (all statuses)
func (r *Repository) GetByOrgID(orgID int) ([]League, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, age_group, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, status, created_at, updated_at, created_by,
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
func (r *Repository) GetByOrgIDAndStatus(orgID int, status LeagueStatus) ([]League, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		       season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		       venue_id, age_group, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, status, created_at, updated_at, created_by,
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

	query := `
		INSERT INTO leagues (org_id, sport_id, league_name, division, registration_deadline, season_start_date,
		                     season_end_date, game_occurrences, pricing_strategy, pricing_amount, pricing_per_player,
		                     venue_id, age_group, gender, season_details, registration_url, duration,
		                     minimum_team_players, per_game_fee, status, created_at, updated_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
		RETURNING id
	`

	err = r.db.QueryRow(
		ctx,
		query,
		league.OrgID,
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
		league.AgeGroup,
		league.Gender,
		league.SeasonDetails,
		league.RegistrationURL,
		league.Duration,
		league.MinimumTeamPlayers,
		league.PerGameFee,
		league.Status,
		time.Now(),
		time.Now(),
		league.CreatedBy,
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
		       venue_id, age_group, gender, season_details, registration_url, duration,
		       minimum_team_players, per_game_fee, status, created_at, updated_at, created_by,
		       rejection_reason
		FROM leagues
		WHERE status = $1
		ORDER BY created_at ASC
	`

	return r.scanLeaguesWithParams(ctx, query, LeagueStatusPending.String())
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

// ============= DRAFT METHODS =============

// GetDraftByOrgID retrieves the draft for an organization
func (r *Repository) GetDraftByOrgID(orgID int) (*LeagueDraft, error) {
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

// SaveDraft saves or updates a draft for an organization
func (r *Repository) SaveDraft(draft *LeagueDraft) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	draftDataJSON, err := json.Marshal(draft.DraftData)
	if err != nil {
		return fmt.Errorf("failed to marshal draft data: %w", err)
	}

	// Upsert: insert or update on conflict
	query := `
		INSERT INTO leagues_drafts (org_id, draft_data, created_at, updated_at, created_by)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (org_id) DO UPDATE
		SET draft_data = $2, updated_at = $4, created_by = $5
		RETURNING id
	`

	err = r.db.QueryRow(
		ctx,
		query,
		draft.OrgID,
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

// DeleteDraft deletes a draft for an organization
func (r *Repository) DeleteDraft(orgID int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `DELETE FROM leagues_drafts WHERE org_id = $1`

	result, err := r.db.Exec(ctx, query, orgID)
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
			&league.AgeGroup,
			&league.Gender,
			&league.SeasonDetails,
			&league.RegistrationURL,
			&league.Duration,
			&league.MinimumTeamPlayers,
			&league.PerGameFee,
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
