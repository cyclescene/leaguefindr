package sports

import (
	"fmt"

	"github.com/leaguefindr/backend/internal/auth"
)

type Service struct {
	repo     RepositoryInterface
	authRepo auth.RepositoryInterface
}

func NewService(repo RepositoryInterface, authRepo auth.RepositoryInterface) *Service {
	return &Service{
		repo:     repo,
		authRepo: authRepo,
	}
}

// GetAllSports retrieves all sports regardless of status (admin dashboard only)
func (s *Service) GetAllSports() ([]Sport, error) {
	return s.repo.GetAll()
}

// GetApprovedSports retrieves all approved sports (public)
func (s *Service) GetApprovedSports() ([]Sport, error) {
	return s.repo.GetAllApproved()
}

// GetSportByID retrieves a sport by ID (approved only, public)
func (s *Service) GetSportByID(id int) (*Sport, error) {
	return s.repo.GetByID(id)
}

// CreateSport submits a new sport request or increments request count if sport already exists
// If user is admin, auto-approves new sports; otherwise sets status to pending
// If sport already exists, increments the request_count instead of creating a duplicate
func (s *Service) CreateSport(userID string, req *CreateSportRequest) (*Sport, error) {
	// First check if sport already exists
	existingSport, err := s.repo.CheckSportExists(req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to check sport existence: %w", err)
	}

	// If sport already exists, increment request count and return it
	if existingSport != nil {
		err = s.repo.IncrementRequestCount(existingSport.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to increment request count: %w", err)
		}
		// Refresh the sport data to get updated request count
		refreshedSport, err := s.repo.CheckSportExists(req.Name)
		if err != nil {
			return nil, fmt.Errorf("failed to retrieve updated sport: %w", err)
		}
		return refreshedSport, nil
	}

	// Sport doesn't exist, create new one
	// Get user to check role
	user, err := s.authRepo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Determine status based on user role
	status := SportStatusPending
	if user.Role == auth.RoleAdmin {
		status = SportStatusApproved
	}

	// Create sport with request_count = 1 (the user creating it counts as a request)
	sport := &Sport{
		Name:         req.Name,
		Status:       status,
		CreatedBy:    &userID,
		RequestCount: 1,
	}

	err = s.repo.Create(sport)
	if err != nil {
		return nil, err
	}

	return sport, nil
}

// GetPendingSports retrieves all pending sport submissions (admin only)
func (s *Service) GetPendingSports() ([]Sport, error) {
	return s.repo.GetPending()
}

// ApproveSport approves a pending sport submission (admin only)
func (s *Service) ApproveSport(sportID int) error {
	return s.repo.UpdateStatus(sportID, SportStatusApproved, nil)
}

// RejectSport rejects a pending sport submission with a reason (admin only)
func (s *Service) RejectSport(sportID int, req *RejectSportRequest) error {
	return s.repo.UpdateStatus(sportID, SportStatusRejected, &req.RejectionReason)
}

// CheckSportExists checks if a sport exists by name (case-insensitive)
// Returns the sport details including status and rejection reason if applicable
func (s *Service) CheckSportExists(name string) (*Sport, error) {
	return s.repo.CheckSportExists(name)
}
