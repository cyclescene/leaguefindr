package venues

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

// GetAllVenues retrieves all venues
func (s *Service) GetAllVenues(ctx context.Context) ([]Venue, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetAll(ctx)
}

// GetVenueByID retrieves a venue by ID
func (s *Service) GetVenueByID(ctx context.Context, id int) (*Venue, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetByID(ctx, id)
}

// CheckVenueExists checks if a venue exists by address
func (s *Service) CheckVenueExists(ctx context.Context, address string) (*Venue, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetByAddress(ctx, address)
}

// CreateVenue creates a new venue (auto-creates if doesn't exist)
// Returns the existing venue if it already exists (by address), or the newly created one
func (s *Service) CreateVenue(ctx context.Context, req *CreateVenueRequest) (*Venue, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)

	// Check if venue with this address already exists
	existingVenue, err := repo.GetByAddress(ctx, req.Address)
	if err != nil {
		return nil, fmt.Errorf("failed to check venue existence: %w", err)
	}

	// If venue address already exists, return it
	if existingVenue != nil {
		return existingVenue, nil
	}

	// Venue doesn't exist, create it
	venue := &Venue{
		Name:    req.Name,
		Address: req.Address,
		Lat:     req.Lat,
		Lng:     req.Lng,
	}

	createdVenue, err := repo.Create(ctx, venue)
	if err != nil {
		return nil, fmt.Errorf("failed to create venue: %w", err)
	}

	return createdVenue, nil
}
