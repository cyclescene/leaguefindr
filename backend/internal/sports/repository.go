package sports

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"

	"github.com/supabase-community/postgrest-go"
)

// RepositoryInterface defines the contract for repository implementations
type RepositoryInterface interface {
	GetAll(ctx context.Context) ([]Sport, error)
	GetByID(ctx context.Context, id int) (*Sport, error)
	GetByName(ctx context.Context, name string) (*Sport, error)
	Create(ctx context.Context, name string) (*Sport, error)
}

type Repository struct {
	client *postgrest.Client
}

func NewRepository(client *postgrest.Client) *Repository {
	return &Repository{client: client}
}

// GetAll retrieves all sports
func (r *Repository) GetAll(ctx context.Context) ([]Sport, error) {
	var sports []Sport
	_, err := r.client.From("sports").
		Select("*", "", false).
		ExecuteToWithContext(ctx, &sports)

	if err != nil {
		return nil, fmt.Errorf("failed to query sports: %w", err)
	}

	if sports == nil {
		sports = []Sport{}
	}

	return sports, nil
}

// GetByID retrieves a sport by ID
func (r *Repository) GetByID(ctx context.Context, id int) (*Sport, error) {
	var sports []Sport
	_, err := r.client.From("sports").
		Select("*", "", false).
		Eq("id", strconv.Itoa(id)).
		ExecuteToWithContext(ctx, &sports)

	if err != nil || len(sports) == 0 {
		return nil, fmt.Errorf("sport not found")
	}

	return &sports[0], nil
}

// GetByName retrieves a sport by name (case-insensitive)
func (r *Repository) GetByName(ctx context.Context, name string) (*Sport, error) {
	var sports []Sport
	_, err := r.client.From("sports").
		Select("*", "", false).
		Ilike("name", name).
		ExecuteToWithContext(ctx, &sports)

	if err != nil || len(sports) == 0 {
		return nil, nil // Return nil if not found (not an error)
	}

	return &sports[0], nil
}

// Create creates a new sport in the database
func (r *Repository) Create(ctx context.Context, name string) (*Sport, error) {
	insertData := map[string]interface{}{
		"name": name,
	}

	var result []map[string]interface{}
	_, err := r.client.From("sports").
		Insert(insertData, true, "", "", "").
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return nil, fmt.Errorf("failed to create sport: %w", err)
	}

	sport := &Sport{Name: name}

	// Extract ID from result if available
	if len(result) > 0 && result[0]["id"] != nil {
		idVal := result[0]["id"]
		slog.Debug("sport create result", "id_value", idVal, "id_type", fmt.Sprintf("%T", idVal))

		// Try multiple type assertions since JSON unmarshaling can produce different types
		switch v := idVal.(type) {
		case float64:
			sport.ID = int64(v)
		case int:
			sport.ID = int64(v)
		case int64:
			sport.ID = v
		default:
			slog.Warn("unexpected type for sport ID", "type", fmt.Sprintf("%T", idVal), "value", idVal)
		}
	} else {
		slog.Warn("no ID in sport create result", "result", result)
	}

	return sport, nil
}
