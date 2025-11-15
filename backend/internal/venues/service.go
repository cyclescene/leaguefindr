package venues

import (
	"fmt"
)

type Service struct {
	repo RepositoryInterface
}

func NewService(repo RepositoryInterface) *Service {
	return &Service{
		repo: repo,
	}
}

// GetAllVenues retrieves all venues
func (s *Service) GetAllVenues() ([]Venue, error) {
	return s.repo.GetAll()
}

// GetVenueByID retrieves a venue by ID
func (s *Service) GetVenueByID(id int) (*Venue, error) {
	return s.repo.GetByID(id)
}

// CheckVenueExists checks if a venue exists by address
func (s *Service) CheckVenueExists(address string) (*Venue, error) {
	return s.repo.GetByAddress(address)
}

// CreateVenue creates a new venue (auto-creates if doesn't exist)
// Returns the existing venue if it already exists (by address), or the newly created one
func (s *Service) CreateVenue(req *CreateVenueRequest) (*Venue, error) {
	// Check if venue with this address already exists
	existingVenue, err := s.repo.GetByAddress(req.Address)
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

	createdVenue, err := s.repo.Create(venue)
	if err != nil {
		return nil, fmt.Errorf("failed to create venue: %w", err)
	}

	return createdVenue, nil
}
