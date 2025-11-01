package venues

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

// GetAllVenues retrieves all venues regardless of status (admin dashboard only)
func (s *Service) GetAllVenues() ([]Venue, error) {
	return s.repo.GetAll()
}

// GetApprovedVenues retrieves all approved venues (public)
func (s *Service) GetApprovedVenues() ([]Venue, error) {
	return s.repo.GetAllApproved()
}

// GetVenueByID retrieves a venue by ID (approved only, public)
func (s *Service) GetVenueByID(id int) (*Venue, error) {
	return s.repo.GetByID(id)
}

// CreateVenue submits a new venue request
// If user is admin, auto-approves; otherwise sets status to pending
func (s *Service) CreateVenue(userID string, req *CreateVenueRequest) (*Venue, error) {
	// Get user to check role
	user, err := s.authRepo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Determine status based on user role
	status := VenueStatusPending
	if user.Role == auth.RoleAdmin {
		status = VenueStatusApproved
	}

	// Create venue
	venue := &Venue{
		Name:    req.Name,
		Address: req.Address,
		Lat:     req.Lat,
		Lng:     req.Lng,
		Status:  status,
		CreatedBy: &userID,
	}

	err = s.repo.Create(venue)
	if err != nil {
		return nil, err
	}

	return venue, nil
}

// GetPendingVenues retrieves all pending venue submissions (admin only)
func (s *Service) GetPendingVenues() ([]Venue, error) {
	return s.repo.GetPending()
}

// ApproveVenue approves a pending venue submission (admin only)
func (s *Service) ApproveVenue(venueID int) error {
	return s.repo.UpdateStatus(venueID, VenueStatusApproved, nil)
}

// RejectVenue rejects a pending venue submission with a reason (admin only)
func (s *Service) RejectVenue(venueID int, req *RejectVenueRequest) error {
	return s.repo.UpdateStatus(venueID, VenueStatusRejected, &req.RejectionReason)
}
