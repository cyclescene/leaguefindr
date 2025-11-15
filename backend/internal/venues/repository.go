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
	GetByID(id int) (*Venue, error)
	GetByAddress(address string) (*Venue, error)
	Create(venue *Venue) (*Venue, error)
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetAll retrieves all venues
func (r *Repository) GetAll() ([]Venue, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, name, address, lat, lng
		FROM venues
		ORDER BY name ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all venues: %w", err)
	}
	defer rows.Close()

	var venues []Venue
	for rows.Next() {
		var venue Venue
		err := rows.Scan(&venue.ID, &venue.Name, &venue.Address, &venue.Lat, &venue.Lng)
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

// GetByID retrieves a venue by ID
func (r *Repository) GetByID(id int) (*Venue, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	venue := &Venue{}

	query := `
		SELECT id, name, address, lat, lng
		FROM venues
		WHERE id = $1
	`

	err := r.db.QueryRow(ctx, query, id).Scan(&venue.ID, &venue.Name, &venue.Address, &venue.Lat, &venue.Lng)

	if err != nil {
		return nil, fmt.Errorf("venue not found")
	}

	return venue, nil
}

// GetByAddress retrieves a venue by address (case-insensitive)
func (r *Repository) GetByAddress(address string) (*Venue, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	venue := &Venue{}

	query := `
		SELECT id, name, address, lat, lng
		FROM venues
		WHERE LOWER(address) = LOWER($1)
		LIMIT 1
	`

	err := r.db.QueryRow(ctx, query, address).Scan(&venue.ID, &venue.Name, &venue.Address, &venue.Lat, &venue.Lng)

	if err != nil {
		return nil, nil // Return nil if no venue found (not an error)
	}

	return venue, nil
}

// Create creates a new venue in the database
func (r *Repository) Create(venue *Venue) (*Venue, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO venues (name, address, lat, lng)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query, venue.Name, venue.Address, venue.Lat, venue.Lng).Scan(&venue.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to create venue: %w", err)
	}

	return venue, nil
}
