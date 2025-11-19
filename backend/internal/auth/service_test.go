package auth

import (
	"testing"
)

// MockRepository is a mock implementation of Repository for testing
type MockRepository struct {
	users map[string]*User
}

func NewMockRepository() *MockRepository {
	return &MockRepository{
		users: make(map[string]*User),
	}
}

func (m *MockRepository) CreateUser(userID, email, organizationName string, role Role) error {
	user := &User{
		ID:       userID,
		Email:    email,
		Role:     role,
		IsActive: true,
	}
	m.users[userID] = user
	return nil
}

func (m *MockRepository) GetUserByID(userID string) (*User, error) {
	user, exists := m.users[userID]
	if !exists {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (m *MockRepository) UserExists(userID string) (bool, error) {
	_, exists := m.users[userID]
	return exists, nil
}

func (m *MockRepository) AdminExists() (bool, error) {
	for _, user := range m.users {
		if user.Role == RoleAdmin {
			return true, nil
		}
	}
	return false, nil
}

func (m *MockRepository) UpdateLastLogin(userID string) error {
	user, exists := m.users[userID]
	if !exists {
		return ErrUserNotFound
	}
	user.LoginCount++
	return nil
}

func (m *MockRepository) UpdateUserRole(userID string, role Role) error {
	user, exists := m.users[userID]
	if !exists {
		return ErrUserNotFound
	}
	user.Role = role
	return nil
}

// Error definitions for testing
var (
	ErrUserNotFound = &ValidationError{msg: "user not found"}
)

type ValidationError struct {
	msg string
}

func (e *ValidationError) Error() string {
	return e.msg
}

// Tests

func TestRegisterUser_Success(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	err := service.RegisterUser("clerk_123", "test@example.com", "Test Org")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	// Verify user was created
	user, err := repo.GetUserByID("clerk_123")
	if err != nil {
		t.Fatalf("user should exist: %v", err)
	}

	if user.ID != "clerk_123" {
		t.Errorf("expected user ID clerk_123, got %s", user.ID)
	}

	if user.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", user.Email)
	}

	if user.OrganizationName != "Test Org" {
		t.Errorf("expected organization name 'Test Org', got %s", user.OrganizationName)
	}

	// First user registered is admin
	if user.Role != RoleAdmin {
		t.Errorf("expected role admin for first user, got %s", user.Role)
	}

	if !user.IsActive {
		t.Error("expected user to be active")
	}
}

func TestRegisterUser_AlreadyExists(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Register first user
	err := service.RegisterUser("clerk_123", "test@example.com", "Test Org")
	if err != nil {
		t.Fatalf("first registration failed: %v", err)
	}

	// Try to register same user again
	err = service.RegisterUser("clerk_123", "test@example.com", "Test Org")
	if err == nil {
		t.Error("expected error when registering existing user")
	}
}

func TestGetUser_Success(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Create user first
	err := service.RegisterUser("clerk_123", "test@example.com", "Test Org")
	if err != nil {
		t.Fatalf("registration failed: %v", err)
	}

	// Get user
	user, err := service.GetUser("clerk_123")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if user.ID != "clerk_123" {
		t.Errorf("expected user ID clerk_123, got %s", user.ID)
	}

	if user.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", user.Email)
	}
}

func TestGetUser_NotFound(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	_, err := service.GetUser("nonexistent")
	if err == nil {
		t.Error("expected error for nonexistent user")
	}
}

func TestValidateUserRole_Success(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Create first user (will be admin)
	err := service.RegisterUser("clerk_first", "first@example.com", "Org 1")
	if err != nil {
		t.Fatalf("first registration failed: %v", err)
	}

	// Create second user (will be regular user)
	err = service.RegisterUser("clerk_second", "second@example.com", "Org 2")
	if err != nil {
		t.Fatalf("second registration failed: %v", err)
	}

	// Validate second user has role 'user'
	isValid, err := service.ValidateUserRole("clerk_second", RoleUser)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if !isValid {
		t.Error("expected user to have role 'user'")
	}
}

func TestValidateUserRole_InvalidRole(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Create first user (will be admin)
	err := service.RegisterUser("clerk_first", "first@example.com", "Org 1")
	if err != nil {
		t.Fatalf("first registration failed: %v", err)
	}

	// Create second user (will be regular user)
	err = service.RegisterUser("clerk_second", "second@example.com", "Org 2")
	if err != nil {
		t.Fatalf("second registration failed: %v", err)
	}

	// Validate second user does not have role 'admin'
	isValid, err := service.ValidateUserRole("clerk_second", RoleAdmin)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if isValid {
		t.Error("expected user not to have role 'admin'")
	}
}

func TestValidateUserRole_InactiveUser(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Create and deactivate user
	err := service.RegisterUser("clerk_123", "test@example.com", "Test Org")
	if err != nil {
		t.Fatalf("registration failed: %v", err)
	}

	user, _ := repo.GetUserByID("clerk_123")
	user.IsActive = false

	// Try to validate role
	_, err = service.ValidateUserRole("clerk_123", RoleUser)
	if err == nil {
		t.Error("expected error for inactive user")
	}
}

func TestRecordLogin_Success(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Create user
	err := service.RegisterUser("clerk_123", "test@example.com", "Test Org")
	if err != nil {
		t.Fatalf("registration failed: %v", err)
	}

	// Record login
	err = service.RecordLogin("clerk_123")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	// Verify login count incremented
	user, _ := repo.GetUserByID("clerk_123")
	if user.LoginCount != 1 {
		t.Errorf("expected login count 1, got %d", user.LoginCount)
	}
}

func TestRecordLogin_NonexistentUser(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	err := service.RecordLogin("nonexistent")
	if err == nil {
		t.Error("expected error for nonexistent user")
	}
}

func TestRecordLogin_Multiple(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Create user
	err := service.RegisterUser("clerk_123", "test@example.com", "Test Org")
	if err != nil {
		t.Fatalf("registration failed: %v", err)
	}

	// Record multiple logins
	for i := 1; i <= 5; i++ {
		err = service.RecordLogin("clerk_123")
		if err != nil {
			t.Fatalf("record login failed: %v", err)
		}

		user, _ := repo.GetUserByID("clerk_123")
		if user.LoginCount != i {
			t.Errorf("expected login count %d, got %d", i, user.LoginCount)
		}
	}
}

func TestRegisterUser_FirstUserIsAdmin(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Register first user
	err := service.RegisterUser("clerk_first", "first@example.com", "Org 1")
	if err != nil {
		t.Fatalf("first registration failed: %v", err)
	}

	// Verify first user is admin
	user, err := repo.GetUserByID("clerk_first")
	if err != nil {
		t.Fatalf("user should exist: %v", err)
	}

	if user.Role != RoleAdmin {
		t.Errorf("expected first user to be admin, got %s", user.Role)
	}
}

func TestRegisterUser_SecondUserIsRegular(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Register first user (will be admin)
	err := service.RegisterUser("clerk_first", "first@example.com", "Org 1")
	if err != nil {
		t.Fatalf("first registration failed: %v", err)
	}

	// Register second user
	err = service.RegisterUser("clerk_second", "second@example.com", "Org 2")
	if err != nil {
		t.Fatalf("second registration failed: %v", err)
	}

	// Verify second user is regular user
	user, err := repo.GetUserByID("clerk_second")
	if err != nil {
		t.Fatalf("user should exist: %v", err)
	}

	if user.Role != RoleUser {
		t.Errorf("expected second user to be user, got %s", user.Role)
	}
}

func TestUpdateUserRole_Success(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	// Create user
	err := service.RegisterUser("clerk_123", "test@example.com", "Test Org")
	if err != nil {
		t.Fatalf("registration failed: %v", err)
	}

	// Update role
	err = service.UpdateUserRole("clerk_123", RoleAdmin)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	// Verify role was updated
	user, _ := repo.GetUserByID("clerk_123")
	if user.Role != RoleAdmin {
		t.Errorf("expected admin role, got %s", user.Role)
	}
}

func TestUpdateUserRole_NonexistentUser(t *testing.T) {
	repo := NewMockRepository()
	service := NewService(repo)

	err := service.UpdateUserRole("nonexistent", RoleAdmin)
	if err == nil {
		t.Error("expected error for nonexistent user")
	}
}
