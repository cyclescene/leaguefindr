package sports

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

// GetAllSports retrieves all sports
func (s *Service) GetAllSports() ([]Sport, error) {
	return s.repo.GetAll()
}

// GetSportByID retrieves a sport by ID
func (s *Service) GetSportByID(id int) (*Sport, error) {
	return s.repo.GetByID(id)
}

// CheckSportExists checks if a sport exists by name
func (s *Service) CheckSportExists(name string) (*Sport, error) {
	return s.repo.GetByName(name)
}

// CreateSport creates a new sport (auto-creates if doesn't exist)
// Returns the existing sport if it already exists, or the newly created one
func (s *Service) CreateSport(req *CreateSportRequest) (*Sport, error) {
	// Check if sport already exists
	existingSport, err := s.repo.GetByName(req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to check sport existence: %w", err)
	}

	// If sport already exists, return it
	if existingSport != nil {
		return existingSport, nil
	}

	// Sport doesn't exist, create it
	sport, err := s.repo.Create(req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to create sport: %w", err)
	}

	return sport, nil
}
