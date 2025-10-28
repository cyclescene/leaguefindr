package sports

import (
	"testing"
	"time"

	"github.com/leaguefindr/backend/internal/auth"
)

// MockSportRepository is a mock implementation of RepositoryInterface for testing
type MockSportRepository struct {
	sports map[int]*Sport
	nextID int
}

func NewMockSportRepository() *MockSportRepository {
	return &MockSportRepository{
		sports: make(map[int]*Sport),
		nextID: 1,
	}
}

func (m *MockSportRepository) GetAll() ([]Sport, error) {
	var sports []Sport
	for _, sport := range m.sports {
		sports = append(sports, *sport)
	}
	return sports, nil
}

func (m *MockSportRepository) GetAllApproved() ([]Sport, error) {
	var sports []Sport
	for _, sport := range m.sports {
		if sport.Status == SportStatusApproved {
			sports = append(sports, *sport)
		}
	}
	return sports, nil
}

func (m *MockSportRepository) GetByID(id int) (*Sport, error) {
	sport, exists := m.sports[id]
	if !exists {
		return nil, ErrSportNotFound
	}
	if sport.Status != SportStatusApproved {
		return nil, ErrSportNotFound
	}
	return sport, nil
}

func (m *MockSportRepository) Create(sport *Sport) error {
	sport.ID = m.nextID
	sport.CreatedAt = time.Now()
	sport.UpdatedAt = time.Now()
	m.sports[m.nextID] = sport
	m.nextID++
	return nil
}

func (m *MockSportRepository) GetPending() ([]Sport, error) {
	var sports []Sport
	for _, sport := range m.sports {
		if sport.Status == SportStatusPending {
			sports = append(sports, *sport)
		}
	}
	return sports, nil
}

func (m *MockSportRepository) UpdateStatus(id int, status SportStatus, rejectionReason *string) error {
	sport, exists := m.sports[id]
	if !exists {
		return ErrSportNotFound
	}
	sport.Status = status
	sport.RejectionReason = rejectionReason
	sport.UpdatedAt = time.Now()
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
	ErrSportNotFound = &ValidationError{msg: "sport not found"}
	ErrUserNotFound  = &ValidationError{msg: "user not found"}
)

type ValidationError struct {
	msg string
}

func (e *ValidationError) Error() string {
	return e.msg
}

// Tests

func TestGetAllApprovedSports_Success(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create some sports
	sport1 := &Sport{Name: "Basketball", Status: SportStatusApproved}
	sport2 := &Sport{Name: "Soccer", Status: SportStatusApproved}
	sport3 := &Sport{Name: "Pending Sport", Status: SportStatusPending}

	repo.Create(sport1)
	repo.Create(sport2)
	repo.Create(sport3)

	sports, err := service.GetApprovedSports()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(sports) != 2 {
		t.Errorf("expected 2 approved sports, got %d", len(sports))
	}

	found := false
	for _, s := range sports {
		if s.Name == "Basketball" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected to find Basketball sport")
	}
}

func TestGetApprovedSports_EmptyList(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	sports, err := service.GetApprovedSports()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(sports) != 0 {
		t.Errorf("expected 0 sports, got %d", len(sports))
	}
}

func TestGetSportByID_Success(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	sport := &Sport{Name: "Tennis", Status: SportStatusApproved}
	repo.Create(sport)

	retrieved, err := service.GetSportByID(sport.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if retrieved.Name != "Tennis" {
		t.Errorf("expected Tennis, got %s", retrieved.Name)
	}
}

func TestGetSportByID_NotFound(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	_, err := service.GetSportByID(999)
	if err == nil {
		t.Error("expected error for non-existent sport")
	}
}

func TestGetSportByID_PendingNotReturned(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	sport := &Sport{Name: "Pending Sport", Status: SportStatusPending}
	repo.Create(sport)

	_, err := service.GetSportByID(sport.ID)
	if err == nil {
		t.Error("expected error when retrieving pending sport")
	}
}

func TestCreateSport_AdminAutoApproves(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create admin user
	authRepo.CreateUser("admin_123", "admin@example.com", "Test Org", auth.RoleAdmin)

	req := &CreateSportRequest{Name: "Baseball"}
	sport, err := service.CreateSport("admin_123", req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if sport.Status != SportStatusApproved {
		t.Errorf("expected status approved, got %s", sport.Status)
	}

	if sport.Name != "Baseball" {
		t.Errorf("expected Baseball, got %s", sport.Name)
	}
}

func TestCreateSport_RegularUserPending(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create regular user
	authRepo.CreateUser("user_123", "user@example.com", "Test Org", auth.RoleUser)

	req := &CreateSportRequest{Name: "Volleyball"}
	sport, err := service.CreateSport("user_123", req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if sport.Status != SportStatusPending {
		t.Errorf("expected status pending, got %s", sport.Status)
	}

	if sport.Name != "Volleyball" {
		t.Errorf("expected Volleyball, got %s", sport.Name)
	}
}

func TestCreateSport_UserNotFound(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	req := &CreateSportRequest{Name: "Golf"}
	_, err := service.CreateSport("nonexistent_user", req)
	if err == nil {
		t.Error("expected error for non-existent user")
	}
}

func TestCreateSport_StoresUserID(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	authRepo.CreateUser("user_456", "user@example.com", "Test Org", auth.RoleUser)

	req := &CreateSportRequest{Name: "Rugby"}
	sport, err := service.CreateSport("user_456", req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if sport.CreatedBy == nil || *sport.CreatedBy != "user_456" {
		t.Errorf("expected CreatedBy to be user_456, got %v", sport.CreatedBy)
	}
}

func TestGetAllSports_Success(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create sports with different statuses
	sport1 := &Sport{Name: "Basketball", Status: SportStatusApproved}
	sport2 := &Sport{Name: "Pending Sport", Status: SportStatusPending}
	sport3 := &Sport{Name: "Rejected Sport", Status: SportStatusRejected}

	repo.Create(sport1)
	repo.Create(sport2)
	repo.Create(sport3)

	sports, err := service.GetAllSports()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(sports) != 3 {
		t.Errorf("expected 3 sports, got %d", len(sports))
	}
}

func TestGetPendingSports_Success(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create sports with different statuses
	sport1 := &Sport{Name: "Basketball", Status: SportStatusApproved}
	sport2 := &Sport{Name: "Pending Sport 1", Status: SportStatusPending}
	sport3 := &Sport{Name: "Pending Sport 2", Status: SportStatusPending}

	repo.Create(sport1)
	repo.Create(sport2)
	repo.Create(sport3)

	sports, err := service.GetPendingSports()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(sports) != 2 {
		t.Errorf("expected 2 pending sports, got %d", len(sports))
	}

	for _, s := range sports {
		if s.Status != SportStatusPending {
			t.Errorf("expected status pending, got %s", s.Status)
		}
	}
}

func TestGetPendingSports_Empty(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	sports, err := service.GetPendingSports()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(sports) != 0 {
		t.Errorf("expected 0 pending sports, got %d", len(sports))
	}
}

func TestApproveSport_Success(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	sport := &Sport{Name: "Pending Sport", Status: SportStatusPending}
	repo.Create(sport)
	sportID := sport.ID

	err := service.ApproveSport(sportID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	updated := repo.sports[sportID]
	if updated.Status != SportStatusApproved {
		t.Errorf("expected status approved, got %s", updated.Status)
	}
}

func TestApproveSport_NotFound(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	err := service.ApproveSport(999)
	if err == nil {
		t.Error("expected error for non-existent sport")
	}
}

func TestRejectSport_Success(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	sport := &Sport{Name: "Pending Sport", Status: SportStatusPending}
	repo.Create(sport)
	sportID := sport.ID

	reason := "Not appropriate"
	req := &RejectSportRequest{RejectionReason: reason}
	err := service.RejectSport(sportID, req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	updated := repo.sports[sportID]
	if updated.Status != SportStatusRejected {
		t.Errorf("expected status rejected, got %s", updated.Status)
	}

	if updated.RejectionReason == nil || *updated.RejectionReason != reason {
		t.Errorf("expected rejection reason %s, got %v", reason, updated.RejectionReason)
	}
}

func TestRejectSport_NotFound(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	req := &RejectSportRequest{RejectionReason: "Invalid"}
	err := service.RejectSport(999, req)
	if err == nil {
		t.Error("expected error for non-existent sport")
	}
}

func TestCreateSport_MultipleUsers(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	// Create multiple users
	authRepo.CreateUser("user_1", "user1@example.com", "Org 1", auth.RoleUser)
	authRepo.CreateUser("user_2", "user2@example.com", "Org 2", auth.RoleUser)
	authRepo.CreateUser("admin_1", "admin@example.com", "Admin Org", auth.RoleAdmin)

	// User 1 creates a sport (should be pending)
	req1 := &CreateSportRequest{Name: "Sport 1"}
	sport1, err := service.CreateSport("user_1", req1)
	if err != nil {
		t.Fatalf("user_1 creation failed: %v", err)
	}

	if sport1.Status != SportStatusPending {
		t.Errorf("user_1 sport should be pending, got %s", sport1.Status)
	}

	// User 2 creates a sport (should be pending)
	req2 := &CreateSportRequest{Name: "Sport 2"}
	sport2, err := service.CreateSport("user_2", req2)
	if err != nil {
		t.Fatalf("user_2 creation failed: %v", err)
	}

	if sport2.Status != SportStatusPending {
		t.Errorf("user_2 sport should be pending, got %s", sport2.Status)
	}

	// Admin creates a sport (should be approved)
	req3 := &CreateSportRequest{Name: "Sport 3"}
	sport3, err := service.CreateSport("admin_1", req3)
	if err != nil {
		t.Fatalf("admin_1 creation failed: %v", err)
	}

	if sport3.Status != SportStatusApproved {
		t.Errorf("admin_1 sport should be approved, got %s", sport3.Status)
	}

	// Verify pending count
	pending, _ := service.GetPendingSports()
	if len(pending) != 2 {
		t.Errorf("expected 2 pending sports, got %d", len(pending))
	}

	// Verify approved count
	approved, _ := service.GetApprovedSports()
	if len(approved) != 1 {
		t.Errorf("expected 1 approved sport, got %d", len(approved))
	}
}

func TestApproveSport_UpdatesTimestamp(t *testing.T) {
	repo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(repo, authRepo)

	sport := &Sport{Name: "Pending Sport", Status: SportStatusPending}
	repo.Create(sport)
	sportID := sport.ID

	originalTime := repo.sports[sportID].UpdatedAt

	// Wait a bit to ensure time difference
	time.Sleep(10 * time.Millisecond)

	service.ApproveSport(sportID)

	updatedTime := repo.sports[sportID].UpdatedAt
	if updatedTime.Before(originalTime) || updatedTime.Equal(originalTime) {
		t.Error("expected UpdatedAt to be updated")
	}
}
