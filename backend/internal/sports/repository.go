package sports

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RepositoryInterface defines the contract for repository implementations
type RepositoryInterface interface {
	GetAll() ([]Sport, error)
	GetAllApproved() ([]Sport, error)
	GetByID(id int) (*Sport, error)
	Create(sport *Sport) error
	GetPending() ([]Sport, error)
	UpdateStatus(id int, status SportStatus, rejectionReason *string) error
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetAll retrieves all sports regardless of status (admin dashboard)
func (r *Repository) GetAll() ([]Sport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, name, status, created_at, updated_at, created_by, rejection_reason
		FROM sports
		ORDER BY
		  CASE
		    WHEN status = 'pending' THEN 1
		    WHEN status = 'approved' THEN 2
		    WHEN status = 'rejected' THEN 3
		  END,
		  created_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all sports: %w", err)
	}
	defer rows.Close()

	var sports []Sport
	for rows.Next() {
		var sport Sport
		err := rows.Scan(
			&sport.ID,
			&sport.Name,
			&sport.Status,
			&sport.CreatedAt,
			&sport.UpdatedAt,
			&sport.CreatedBy,
			&sport.RejectionReason,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan sport: %w", err)
		}
		sports = append(sports, sport)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return sports, nil
}

// GetAllApproved retrieves all approved sports
func (r *Repository) GetAllApproved() ([]Sport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, name, status, created_at, updated_at, created_by, rejection_reason
		FROM sports
		WHERE status = $1
		ORDER BY name ASC
	`

	rows, err := r.db.Query(ctx, query, SportStatusApproved.String())
	if err != nil {
		return nil, fmt.Errorf("failed to query approved sports: %w", err)
	}
	defer rows.Close()

	var sports []Sport
	for rows.Next() {
		var sport Sport
		err := rows.Scan(
			&sport.ID,
			&sport.Name,
			&sport.Status,
			&sport.CreatedAt,
			&sport.UpdatedAt,
			&sport.CreatedBy,
			&sport.RejectionReason,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan sport: %w", err)
		}
		sports = append(sports, sport)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return sports, nil
}

// GetByID retrieves a sport by ID (approved only)
func (r *Repository) GetByID(id int) (*Sport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	sport := &Sport{}

	query := `
		SELECT id, name, status, created_at, updated_at, created_by, rejection_reason
		FROM sports
		WHERE id = $1 AND status = $2
	`

	err := r.db.QueryRow(ctx, query, id, SportStatusApproved.String()).Scan(
		&sport.ID,
		&sport.Name,
		&sport.Status,
		&sport.CreatedAt,
		&sport.UpdatedAt,
		&sport.CreatedBy,
		&sport.RejectionReason,
	)

	if err != nil {
		return nil, fmt.Errorf("sport not found")
	}

	return sport, nil
}

// Create creates a new sport in the database
func (r *Repository) Create(sport *Sport) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO sports (name, status, created_at, updated_at, created_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	err := r.db.QueryRow(
		ctx,
		query,
		sport.Name,
		sport.Status.String(),
		time.Now(),
		time.Now(),
		sport.CreatedBy,
	).Scan(&sport.ID)

	if err != nil {
		return fmt.Errorf("failed to create sport: %w", err)
	}

	sport.CreatedAt = time.Now()
	sport.UpdatedAt = time.Now()

	return nil
}

// GetPending retrieves all pending sport submissions
func (r *Repository) GetPending() ([]Sport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, name, status, created_at, updated_at, created_by, rejection_reason
		FROM sports
		WHERE status = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(ctx, query, SportStatusPending.String())
	if err != nil {
		return nil, fmt.Errorf("failed to query pending sports: %w", err)
	}
	defer rows.Close()

	var sports []Sport
	for rows.Next() {
		var sport Sport
		err := rows.Scan(
			&sport.ID,
			&sport.Name,
			&sport.Status,
			&sport.CreatedAt,
			&sport.UpdatedAt,
			&sport.CreatedBy,
			&sport.RejectionReason,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan sport: %w", err)
		}
		sports = append(sports, sport)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return sports, nil
}

// UpdateStatus updates the status of a sport
func (r *Repository) UpdateStatus(id int, status SportStatus, rejectionReason *string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE sports
		SET status = $1, rejection_reason = $2, updated_at = NOW()
		WHERE id = $3
	`

	result, err := r.db.Exec(ctx, query, status.String(), rejectionReason, id)
	if err != nil {
		return fmt.Errorf("failed to update sport status: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("sport not found")
	}

	return nil
}
