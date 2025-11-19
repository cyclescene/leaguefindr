package sports

import (
	"context"
	"fmt"

	"github.com/supabase-community/postgrest-go"
)

type Service struct {
	baseClient *postgrest.Client
}

func NewService(baseClient *postgrest.Client) *Service {
	return &Service{
		baseClient: baseClient,
	}
}

// getClientWithAuth creates a new PostgREST client with JWT from context
func (s *Service) getClientWithAuth(ctx context.Context) *postgrest.Client {
	// For sports, we use the base client as-is since it's public reference data
	// But we follow the same pattern for consistency
	return s.baseClient
}

// GetAllSports retrieves all sports
func (s *Service) GetAllSports(ctx context.Context) ([]Sport, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetAll(ctx)
}

// GetSportByID retrieves a sport by ID
func (s *Service) GetSportByID(ctx context.Context, id int) (*Sport, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetByID(ctx, id)
}

// CheckSportExists checks if a sport exists by name
func (s *Service) CheckSportExists(ctx context.Context, name string) (*Sport, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetByName(ctx, name)
}

// CreateSport creates a new sport (auto-creates if doesn't exist)
// Returns the existing sport if it already exists, or the newly created one
func (s *Service) CreateSport(ctx context.Context, req *CreateSportRequest) (*Sport, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)

	// Check if sport already exists
	existingSport, err := repo.GetByName(ctx, req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to check sport existence: %w", err)
	}

	// If sport already exists, return it
	if existingSport != nil {
		return existingSport, nil
	}

	// Sport doesn't exist, create it
	sport, err := repo.Create(ctx, req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to create sport: %w", err)
	}

	return sport, nil
}
