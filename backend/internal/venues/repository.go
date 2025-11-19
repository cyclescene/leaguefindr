package venues

import (
	"context"
	"fmt"
	"strconv"

	"github.com/supabase-community/postgrest-go"
)

// RepositoryInterface defines the contract for repository implementations
type RepositoryInterface interface {
	GetAll(ctx context.Context) ([]Venue, error)
	GetByID(ctx context.Context, id int) (*Venue, error)
	GetByAddress(ctx context.Context, address string) (*Venue, error)
	Create(ctx context.Context, venue *Venue) (*Venue, error)
}

type Repository struct {
	client *postgrest.Client
}

func NewRepository(client *postgrest.Client) *Repository {
	return &Repository{client: client}
}

// GetAll retrieves all venues
func (r *Repository) GetAll(ctx context.Context) ([]Venue, error) {
	var venues []Venue
	_, err := r.client.From("venues").
		Select("*", "", false).
		ExecuteToWithContext(ctx, &venues)

	if err != nil {
		return nil, fmt.Errorf("failed to query venues: %w", err)
	}

	if venues == nil {
		venues = []Venue{}
	}

	return venues, nil
}

// GetByID retrieves a venue by ID
func (r *Repository) GetByID(ctx context.Context, id int) (*Venue, error) {
	var venues []Venue
	_, err := r.client.From("venues").
		Select("*", "", false).
		Eq("id", strconv.Itoa(id)).
		ExecuteToWithContext(ctx, &venues)

	if err != nil || len(venues) == 0 {
		return nil, fmt.Errorf("venue not found")
	}

	return &venues[0], nil
}

// GetByAddress retrieves a venue by address (case-insensitive)
func (r *Repository) GetByAddress(ctx context.Context, address string) (*Venue, error) {
	var venues []Venue
	_, err := r.client.From("venues").
		Select("*", "", false).
		Ilike("address", address).
		ExecuteToWithContext(ctx, &venues)

	if err != nil || len(venues) == 0 {
		return nil, nil // Return nil if not found (not an error)
	}

	return &venues[0], nil
}

// Create creates a new venue in the database
func (r *Repository) Create(ctx context.Context, venue *Venue) (*Venue, error) {
	insertData := map[string]interface{}{
		"name":    venue.Name,
		"address": venue.Address,
		"lat":     venue.Lat,
		"lng":     venue.Lng,
	}

	var result []map[string]interface{}
	_, err := r.client.From("venues").
		Insert(insertData, true, "", "", "").
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return nil, fmt.Errorf("failed to create venue: %w", err)
	}

	venue.Name = venue.Name
	venue.Address = venue.Address
	venue.Lat = venue.Lat
	venue.Lng = venue.Lng

	// Extract ID from result if available
	if len(result) > 0 && result[0]["id"] != nil {
		if id, ok := result[0]["id"].(float64); ok {
			venue.ID = int(id)
		}
	}

	return venue, nil
}
