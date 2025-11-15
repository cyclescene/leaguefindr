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
	GetByID(id int) (*Sport, error)
	GetByName(name string) (*Sport, error)
	Create(name string) (*Sport, error)
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetAll retrieves all sports
func (r *Repository) GetAll() ([]Sport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, name
		FROM sports
		ORDER BY name ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query all sports: %w", err)
	}
	defer rows.Close()

	var sports []Sport
	for rows.Next() {
		var sport Sport
		err := rows.Scan(&sport.ID, &sport.Name)
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

// GetByID retrieves a sport by ID
func (r *Repository) GetByID(id int) (*Sport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	sport := &Sport{}

	query := `
		SELECT id, name
		FROM sports
		WHERE id = $1
	`

	err := r.db.QueryRow(ctx, query, id).Scan(&sport.ID, &sport.Name)

	if err != nil {
		return nil, fmt.Errorf("sport not found")
	}

	return sport, nil
}

// GetByName retrieves a sport by name (case-insensitive)
func (r *Repository) GetByName(name string) (*Sport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	sport := &Sport{}

	query := `
		SELECT id, name
		FROM sports
		WHERE LOWER(name) = LOWER($1)
	`

	err := r.db.QueryRow(ctx, query, name).Scan(&sport.ID, &sport.Name)

	if err != nil {
		return nil, nil // Return nil if not found (not an error)
	}

	return sport, nil
}

// Create creates a new sport in the database
func (r *Repository) Create(name string) (*Sport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	sport := &Sport{Name: name}

	query := `
		INSERT INTO sports (name)
		VALUES ($1)
		RETURNING id
	`

	err := r.db.QueryRow(ctx, query, name).Scan(&sport.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to create sport: %w", err)
	}

	return sport, nil
}
