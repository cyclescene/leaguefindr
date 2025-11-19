package sports

import (
	"context"
	"fmt"

	"github.com/supabase-community/postgrest-go"
)

type Service struct {
	baseClient *postgrest.Client
	baseURL    string
	anonKey    string
}

func NewService(baseClient *postgrest.Client, baseURL string, anonKey string) *Service {
	return &Service{
		baseClient: baseClient,
		baseURL:    baseURL,
		anonKey:    anonKey,
	}
}

// getClientWithAuth creates a new PostgREST client with JWT from context
func (s *Service) getClientWithAuth(ctx context.Context) *postgrest.Client {
	// Extract JWT token from context (set by JWT middleware)
	token := ""
	if jwtVal := ctx.Value("jwt_token"); jwtVal != nil {
		if t, ok := jwtVal.(string); ok {
			token = t
		}
	}

	// Create a new client for this request with the anon key
	client := postgrest.NewClient(
		s.baseURL,
		"public",
		map[string]string{
			"apikey": s.anonKey,
		},
	)

	// Set JWT token if present (this adds it to Authorization header)
	if token != "" {
		client.SetAuthToken(token)
	}

	return client
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
