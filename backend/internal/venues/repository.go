package venues

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RepositoryInterface defines the contract for repository implementations
type RepositoryInterface interface {
	GetAll() ([]Venue, error)
	GetAllApproved() ([]Venue, error)
	GetByID(id int) (*Venue, error)
	Create(venue *Venue) error
	GetPending() ([]Venue, error)
	UpdateStatus(id int, status VenueStatus, rejectionReason *string) error
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetAll retrieves all venues regardless of status (admin dashboard)
func (r *Repository) GetAll() ([]Venue, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, name, address, latitude, longitude, status, created_at, updated_at, created_by, rejection_reason
		FROM venues
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
		return nil, fmt.Errorf("failed to query all venues: %w", err)
	}
	defer rows.Close()

	var venues []Venue
	for rows.Next() {
		var venue Venue
		err := rows.Scan(
			&venue.ID,
			&venue.Name,
			&venue.Address,
			&venue.Latitude,
			&venue.Longitude,
			&venue.Status,
			&venue.CreatedAt,
			&venue.UpdatedAt,
			&venue.CreatedBy,
			&venue.RejectionReason,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan venue: %w", err)
		}
		venues = append(venues, venue)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return venues, nil
}

// GetAllApproved retrieves all approved venues
func (r *Repository) GetAllApproved() ([]Venue, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, name, address, latitude, longitude, status, created_at, updated_at, created_by, rejection_reason
		FROM venues
		WHERE status = $1
		ORDER BY name ASC
	`

	rows, err := r.db.Query(ctx, query, VenueStatusApproved.String())
	if err != nil {
		return nil, fmt.Errorf("failed to query approved venues: %w", err)
	}
	defer rows.Close()

	var venues []Venue
	for rows.Next() {
		var venue Venue
		err := rows.Scan(
			&venue.ID,
			&venue.Name,
			&venue.Address,
			&venue.Latitude,
			&venue.Longitude,
			&venue.Status,
			&venue.CreatedAt,
			&venue.UpdatedAt,
			&venue.CreatedBy,
			&venue.RejectionReason,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan venue: %w", err)
		}
		venues = append(venues, venue)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return venues, nil
}

// GetByID retrieves a venue by ID (approved only)
func (r *Repository) GetByID(id int) (*Venue, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	venue := &Venue{}

	query := `
		SELECT id, name, address, latitude, longitude, status, created_at, updated_at, created_by, rejection_reason
		FROM venues
		WHERE id = $1 AND status = $2
	`

	err := r.db.QueryRow(ctx, query, id, VenueStatusApproved.String()).Scan(
		&venue.ID,
		&venue.Name,
		&venue.Address,
		&venue.Latitude,
		&venue.Longitude,
		&venue.Status,
		&venue.CreatedAt,
		&venue.UpdatedAt,
		&venue.CreatedBy,
		&venue.RejectionReason,
	)

	if err != nil {
		return nil, fmt.Errorf("venue not found")
	}

	return venue, nil
}

// Create creates a new venue in the database
func (r *Repository) Create(venue *Venue) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO venues (name, address, latitude, longitude, status, created_at, updated_at, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`

	err := r.db.QueryRow(
		ctx,
		query,
		venue.Name,
		venue.Address,
		venue.Latitude,
		venue.Longitude,
		venue.Status.String(),
		time.Now(),
		time.Now(),
		venue.CreatedBy,
	).Scan(&venue.ID)

	if err != nil {
		return fmt.Errorf("failed to create venue: %w", err)
	}

	venue.CreatedAt = time.Now()
	venue.UpdatedAt = time.Now()

	return nil
}

// GetPending retrieves all pending venue submissions
func (r *Repository) GetPending() ([]Venue, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, name, address, latitude, longitude, status, created_at, updated_at, created_by, rejection_reason
		FROM venues
		WHERE status = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(ctx, query, VenueStatusPending.String())
	if err != nil {
		return nil, fmt.Errorf("failed to query pending venues: %w", err)
	}
	defer rows.Close()

	var venues []Venue
	for rows.Next() {
		var venue Venue
		err := rows.Scan(
			&venue.ID,
			&venue.Name,
			&venue.Address,
			&venue.Latitude,
			&venue.Longitude,
			&venue.Status,
			&venue.CreatedAt,
			&venue.UpdatedAt,
			&venue.CreatedBy,
			&venue.RejectionReason,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan venue: %w", err)
		}
		venues = append(venues, venue)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error reading rows: %w", err)
	}

	return venues, nil
}

// UpdateStatus updates the status of a venue
func (r *Repository) UpdateStatus(id int, status VenueStatus, rejectionReason *string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE venues
		SET status = $1, rejection_reason = $2, updated_at = NOW()
		WHERE id = $3
	`

	result, err := r.db.Exec(ctx, query, status.String(), rejectionReason, id)
	if err != nil {
		return fmt.Errorf("failed to update venue status: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("venue not found")
	}

	return nil
}
