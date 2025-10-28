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

// CreateSport submits a new sport request
// If user is admin, auto-approves; otherwise sets status to pending
func (s *Service) CreateSport(userID string, req *CreateSportRequest) (*Sport, error) {
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

	// Create sport
	sport := &Sport{
		Name:      req.Name,
		Status:    status,
		CreatedBy: &userID,
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
