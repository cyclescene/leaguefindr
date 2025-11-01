package venues

import (
	"testing"
	"time"

	"github.com/leaguefindr/backend/internal/auth"
)

// MockVenueRepository is a mock implementation of RepositoryInterface for testing
type MockVenueRepository struct {
	venues map[int]*Venue
	nextID int
}

func NewMockVenueRepository() *MockVenueRepository {
	return &MockVenueRepository{
		venues: make(map[int]*Venue),
		nextID: 1,
	}
}

func (m *MockVenueRepository) GetAll() ([]Venue, error) {
	var venues []Venue
	for _, venue := range m.venues {
		venues = append(venues, *venue)
	}
	return venues, nil
}

func (m *MockVenueRepository) GetAllApproved() ([]Venue, error) {
	var venues []Venue
	for _, venue := range m.venues {
		if venue.Status == VenueStatusApproved {
			venues = append(venues, *venue)
		}
	}
	return venues, nil
}

func (m *MockVenueRepository) GetByID(id int) (*Venue, error) {
	venue, exists := m.venues[id]
	if !exists {
		return nil, ErrVenueNotFound
	}
	if venue.Status != VenueStatusApproved {
		return nil, ErrVenueNotFound
	}
	return venue, nil
}

func (m *MockVenueRepository) Create(venue *Venue) error {
	venue.ID = m.nextID
	venue.CreatedAt = time.Now()
	venue.UpdatedAt = time.Now()
	m.venues[m.nextID] = venue
	m.nextID++
	return nil
}

func (m *MockVenueRepository) GetPending() ([]Venue, error) {
	var venues []Venue
	for _, venue := range m.venues {
		if venue.Status == VenueStatusPending {
			venues = append(venues, *venue)
		}
	}
	return venues, nil
}

func (m *MockVenueRepository) UpdateStatus(id int, status VenueStatus, rejectionReason *string) error {
	venue, exists := m.venues[id]
	if !exists {
		return ErrVenueNotFound
	}
	venue.Status = status
	venue.RejectionReason = rejectionReason
	venue.UpdatedAt = time.Now()
	return nil
}

// Mock auth repository
type MockAuthRepository struct {
	users map[string]*auth.User
}

func NewMockAuthRepository() *MockAuthRepository {
	return &MockAuthRepository{
		users: make(map[string]*auth.User),
	}
}

func (m *MockAuthRepository) CreateUser(userID, email, organizationName string, role auth.Role) error {
	m.users[userID] = &auth.User{
		ID:               userID,
		Email:            email,
		Role:             role,
		OrganizationName: organizationName,
		IsActive:         true,
	}
	return nil
}

func (m *MockAuthRepository) GetUserByID(userID string) (*auth.User, error) {
	user, exists := m.users[userID]
	if !exists {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (m *MockAuthRepository) UserExists(userID string) (bool, error) {
	_, exists := m.users[userID]
	return exists, nil
}

func (m *MockAuthRepository) AdminExists() (bool, error) {
	for _, user := range m.users {
		if user.Role == auth.RoleAdmin {
			return true, nil
		}
	}
	return false, nil
}

func (m *MockAuthRepository) UpdateLastLogin(userID string) error {
	return nil
}

func (m *MockAuthRepository) UpdateUserRole(userID string, role auth.Role) error {
	return nil
}

// Error definitions for testing
var (
	ErrVenueNotFound = &ValidationError{msg: "venue not found"}
	ErrUserNotFound  = &ValidationError{msg: "user not found"}
)

type ValidationError struct {
	msg string
}

func (e *ValidationError) Error() string {
	return e.msg
}

// Tests

func TestGetAllApprovedVenues_Success(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create some venues
	venue1 := &Venue{Name: "Madison Square Garden", Address: "33 E 33rd St, NYC", Lat: 40.7505, Lng: -73.9934, Status: VenueStatusApproved}
	venue2 := &Venue{Name: "Staples Center", Address: "1111 S Figueroa St, LA", Lat: 34.0430, Lng: -118.2673, Status: VenueStatusApproved}
	venue3 := &Venue{Name: "Pending Venue", Address: "123 Main St", Lat: 40.0, Lng: -73.0, Status: VenueStatusPending}

	repo.Create(venue1)
	repo.Create(venue2)
	repo.Create(venue3)

	venues, err := service.GetApprovedVenues()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(venues) != 2 {
		t.Errorf("expected 2 approved venues, got %d", len(venues))
	}

	found := false
	for _, v := range venues {
		if v.Name == "Madison Square Garden" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected to find Madison Square Garden venue")
	}
}

func TestGetApprovedVenues_EmptyList(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	venues, err := service.GetApprovedVenues()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(venues) != 0 {
		t.Errorf("expected 0 venues, got %d", len(venues))
	}
}

func TestGetVenueByID_Success(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	venue := &Venue{Name: "Test Arena", Address: "123 Test St", Lat: 40.5, Lng: -73.5, Status: VenueStatusApproved}
	repo.Create(venue)

	retrieved, err := service.GetVenueByID(venue.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if retrieved.Name != "Test Arena" {
		t.Errorf("expected Test Arena, got %s", retrieved.Name)
	}
}

func TestGetVenueByID_NotFound(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	_, err := service.GetVenueByID(999)
	if err == nil {
		t.Error("expected error for non-existent venue")
	}
}

func TestGetVenueByID_PendingNotReturned(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	venue := &Venue{Name: "Pending Venue", Address: "456 Pending St", Lat: 40.0, Lng: -73.0, Status: VenueStatusPending}
	repo.Create(venue)

	_, err := service.GetVenueByID(venue.ID)
	if err == nil {
		t.Error("expected error when retrieving pending venue")
	}
}

func TestCreateVenue_AdminAutoApproves(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create admin user
	authRepo.CreateUser("admin_123", "admin@example.com", "Test Org", auth.RoleAdmin)

	req := &CreateVenueRequest{
		Name:      "Admin Venue",
		Address:   "789 Admin Ave",
		Lat:  40.7128,
		Lng: -74.0060,
	}
	venue, err := service.CreateVenue("admin_123", req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if venue.Status != VenueStatusApproved {
		t.Errorf("expected status approved, got %s", venue.Status)
	}

	if venue.Name != "Admin Venue" {
		t.Errorf("expected Admin Venue, got %s", venue.Name)
	}
}

func TestCreateVenue_RegularUserPending(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create regular user
	authRepo.CreateUser("user_123", "user@example.com", "Test Org", auth.RoleUser)

	req := &CreateVenueRequest{
		Name:      "User Venue",
		Address:   "321 User Lane",
		Lat:  40.7580,
		Lng: -73.9855,
	}
	venue, err := service.CreateVenue("user_123", req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if venue.Status != VenueStatusPending {
		t.Errorf("expected status pending, got %s", venue.Status)
	}

	if venue.Name != "User Venue" {
		t.Errorf("expected User Venue, got %s", venue.Name)
	}
}

func TestCreateVenue_UserNotFound(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	req := &CreateVenueRequest{
		Name:      "Test Venue",
		Address:   "123 Test St",
		Lat:  40.0,
		Lng: -73.0,
	}
	_, err := service.CreateVenue("nonexistent_user", req)
	if err == nil {
		t.Error("expected error for non-existent user")
	}
}

func TestCreateVenue_StoresUserID(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	authRepo.CreateUser("user_456", "user@example.com", "Test Org", auth.RoleUser)

	req := &CreateVenueRequest{
		Name:      "Test Venue",
		Address:   "456 Test St",
		Lat:  40.5,
		Lng: -73.5,
	}
	venue, err := service.CreateVenue("user_456", req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if venue.CreatedBy == nil || *venue.CreatedBy != "user_456" {
		t.Errorf("expected CreatedBy to be user_456, got %v", venue.CreatedBy)
	}
}

func TestCreateVenue_StoresCoordinates(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	authRepo.CreateUser("user_789", "user@example.com", "Test Org", auth.RoleUser)

	req := &CreateVenueRequest{
		Name:      "Coordinate Test",
		Address:   "789 Coord St",
		Lat:  37.7749,
		Lng: -122.4194,
	}
	venue, err := service.CreateVenue("user_789", req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if venue.Lat != 37.7749 {
		t.Errorf("expected lat 37.7749, got %f", venue.Lat)
	}

	if venue.Lng != -122.4194 {
		t.Errorf("expected lng -122.4194, got %f", venue.Lng)
	}
}

func TestGetAllVenues_Success(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create venues with different statuses
	venue1 := &Venue{Name: "Approved Venue", Address: "123 Main St", Lat: 40.0, Lng: -73.0, Status: VenueStatusApproved}
	venue2 := &Venue{Name: "Pending Venue", Address: "456 Pending St", Lat: 40.5, Lng: -73.5, Status: VenueStatusPending}
	venue3 := &Venue{Name: "Rejected Venue", Address: "789 Rejected St", Lat: 41.0, Lng: -74.0, Status: VenueStatusRejected}

	repo.Create(venue1)
	repo.Create(venue2)
	repo.Create(venue3)

	venues, err := service.GetAllVenues()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(venues) != 3 {
		t.Errorf("expected 3 venues, got %d", len(venues))
	}
}

func TestGetPendingVenues_Success(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create venues with different statuses
	venue1 := &Venue{Name: "Approved Venue", Address: "123 Main St", Lat: 40.0, Lng: -73.0, Status: VenueStatusApproved}
	venue2 := &Venue{Name: "Pending Venue 1", Address: "456 Pending St", Lat: 40.5, Lng: -73.5, Status: VenueStatusPending}
	venue3 := &Venue{Name: "Pending Venue 2", Address: "789 Another St", Lat: 41.0, Lng: -74.0, Status: VenueStatusPending}

	repo.Create(venue1)
	repo.Create(venue2)
	repo.Create(venue3)

	venues, err := service.GetPendingVenues()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(venues) != 2 {
		t.Errorf("expected 2 pending venues, got %d", len(venues))
	}

	for _, v := range venues {
		if v.Status != VenueStatusPending {
			t.Errorf("expected status pending, got %s", v.Status)
		}
	}
}

func TestGetPendingVenues_Empty(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	venues, err := service.GetPendingVenues()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(venues) != 0 {
		t.Errorf("expected 0 pending venues, got %d", len(venues))
	}
}

func TestApproveVenue_Success(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	venue := &Venue{Name: "Pending Venue", Address: "123 Pending St", Lat: 40.0, Lng: -73.0, Status: VenueStatusPending}
	repo.Create(venue)
	venueID := venue.ID

	err := service.ApproveVenue(venueID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	updated := repo.venues[venueID]
	if updated.Status != VenueStatusApproved {
		t.Errorf("expected status approved, got %s", updated.Status)
	}
}

func TestApproveVenue_NotFound(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	err := service.ApproveVenue(999)
	if err == nil {
		t.Error("expected error for non-existent venue")
	}
}

func TestRejectVenue_Success(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	venue := &Venue{Name: "Pending Venue", Address: "123 Pending St", Lat: 40.0, Lng: -73.0, Status: VenueStatusPending}
	repo.Create(venue)
	venueID := venue.ID

	reason := "Duplicate of existing venue"
	req := &RejectVenueRequest{RejectionReason: reason}
	err := service.RejectVenue(venueID, req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	updated := repo.venues[venueID]
	if updated.Status != VenueStatusRejected {
		t.Errorf("expected status rejected, got %s", updated.Status)
	}

	if updated.RejectionReason == nil || *updated.RejectionReason != reason {
		t.Errorf("expected rejection reason %s, got %v", reason, updated.RejectionReason)
	}
}

func TestRejectVenue_NotFound(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	req := &RejectVenueRequest{RejectionReason: "Invalid"}
	err := service.RejectVenue(999, req)
	if err == nil {
		t.Error("expected error for non-existent venue")
	}
}

func TestCreateVenue_MultipleUsers(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create multiple users
	authRepo.CreateUser("user_1", "user1@example.com", "Org 1", auth.RoleUser)
	authRepo.CreateUser("user_2", "user2@example.com", "Org 2", auth.RoleUser)
	authRepo.CreateUser("admin_1", "admin@example.com", "Admin Org", auth.RoleAdmin)

	// User 1 creates a venue (should be pending)
	req1 := &CreateVenueRequest{
		Name:      "Venue 1",
		Address:   "123 Venue St",
		Lat:  40.0,
		Lng: -73.0,
	}
	venue1, err := service.CreateVenue("user_1", req1)
	if err != nil {
		t.Fatalf("user_1 creation failed: %v", err)
	}

	if venue1.Status != VenueStatusPending {
		t.Errorf("user_1 venue should be pending, got %s", venue1.Status)
	}

	// User 2 creates a venue (should be pending)
	req2 := &CreateVenueRequest{
		Name:      "Venue 2",
		Address:   "456 Venue Ave",
		Lat:  40.5,
		Lng: -73.5,
	}
	venue2, err := service.CreateVenue("user_2", req2)
	if err != nil {
		t.Fatalf("user_2 creation failed: %v", err)
	}

	if venue2.Status != VenueStatusPending {
		t.Errorf("user_2 venue should be pending, got %s", venue2.Status)
	}

	// Admin creates a venue (should be approved)
	req3 := &CreateVenueRequest{
		Name:      "Venue 3",
		Address:   "789 Admin Ave",
		Lat:  41.0,
		Lng: -74.0,
	}
	venue3, err := service.CreateVenue("admin_1", req3)
	if err != nil {
		t.Fatalf("admin_1 creation failed: %v", err)
	}

	if venue3.Status != VenueStatusApproved {
		t.Errorf("admin_1 venue should be approved, got %s", venue3.Status)
	}

	// Verify pending count
	pending, _ := service.GetPendingVenues()
	if len(pending) != 2 {
		t.Errorf("expected 2 pending venues, got %d", len(pending))
	}

	// Verify approved count
	approved, _ := service.GetApprovedVenues()
	if len(approved) != 1 {
		t.Errorf("expected 1 approved venue, got %d", len(approved))
	}
}

func TestApproveVenue_UpdatesTimestamp(t *testing.T) {
	repo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	venue := &Venue{Name: "Pending Venue", Address: "123 Pending St", Lat: 40.0, Lng: -73.0, Status: VenueStatusPending}
	repo.Create(venue)
	venueID := venue.ID

	originalTime := repo.venues[venueID].UpdatedAt

	// Wait a bit to ensure time difference
	time.Sleep(10 * time.Millisecond)

	service.ApproveVenue(venueID)

	updatedTime := repo.venues[venueID].UpdatedAt
	if updatedTime.Before(originalTime) || updatedTime.Equal(originalTime) {
		t.Error("expected UpdatedAt to be updated")
	}
}
