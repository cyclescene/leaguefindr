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

// CreateVenue submits a new venue request or increments request count if address already exists
// If user is admin, auto-approves new venues; otherwise sets status to pending
// If venue address already exists, increments the request_count instead of creating a duplicate
func (s *Service) CreateVenue(userID string, req *CreateVenueRequest) (*Venue, error) {
	// First check if venue with this address already exists
	existingVenue, err := s.repo.GetByAddress(req.Address)
	if err != nil {
		return nil, fmt.Errorf("failed to check venue existence: %w", err)
	}

	// If venue address already exists, increment request count and return it
	if existingVenue != nil {
		err = s.repo.IncrementRequestCount(existingVenue.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to increment request count: %w", err)
		}
		// Refresh the venue data to get updated request count
		refreshedVenue, err := s.repo.GetByAddress(req.Address)
		if err != nil {
			return nil, fmt.Errorf("failed to retrieve updated venue: %w", err)
		}
		return refreshedVenue, nil
	}

	// Venue doesn't exist, create new one
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

	// Create venue with request_count = 1 (the user creating it counts as a request)
	venue := &Venue{
		Name:         req.Name,
		Address:      req.Address,
		Lat:          req.Lat,
		Lng:          req.Lng,
		Status:       status,
		CreatedBy:    &userID,
		RequestCount: 1,
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
