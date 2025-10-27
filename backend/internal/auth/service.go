package auth

import (
	"fmt"
	"log/slog"
)

type Service struct {
	repo RepositoryInterface
}

func NewService(repo RepositoryInterface) *Service {
	return &Service{repo: repo}
}

// RegisterUser creates a new user with Clerk ID, email, and organization name
func (s *Service) RegisterUser(clerkID, email, organizationName string) error {
	// Check if user already exists
	exists, err := s.repo.UserExists(clerkID)
	if err != nil {
		return fmt.Errorf("failed to check user existence: %w", err)
	}

	// User already exists
	if exists {
		return fmt.Errorf("user already exists")
	}

	// Determine role: first user is admin, others are regular users
	role := RoleUser
	adminExists, err := s.repo.AdminExists()
	if err != nil {
		return fmt.Errorf("failed to check admin existence: %w", err)
	}
	if !adminExists {
		role = RoleAdmin
	}

	// Create new user with determined role
	err = s.repo.CreateUser(clerkID, email, organizationName, role)
	if err != nil {
		return err
	}

	// If this is the first admin user, auto-verify their email so they don't need to verify
	if role == RoleAdmin {
		verifyErr := VerifyUserEmailInClerk(clerkID)
		if verifyErr != nil {
			// Log but don't fail - user can verify manually if needed
			slog.Error("failed to auto-verify admin email", "clerkID", clerkID, "err", verifyErr)
		}
	}

	// Sync user metadata to Clerk (best effort - don't fail registration if sync fails)
	syncErr := SyncUserMetadataToClerk(clerkID, role, organizationName)
	if syncErr != nil {
		// Log the error but don't fail - DB is source of truth
		// TODO: In future, publish to GCP Pub/Sub for async retry
		_ = syncErr
	}

	return nil
}

// GetUser retrieves user information by ID
func (s *Service) GetUser(userID string) (*User, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// ValidateUserRole checks if a user has a specific role
func (s *Service) ValidateUserRole(userID string, requiredRole Role) (bool, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return false, err
	}

	if !user.IsActive {
		return false, fmt.Errorf("user account is inactive")
	}

	return user.Role == requiredRole, nil
}

// RecordLogin updates user's last login time and increments login count
func (s *Service) RecordLogin(userID string) error {
	err := s.repo.UpdateLastLogin(userID)
	if err != nil {
		return err
	}

	return nil
}

// UpdateUserRole updates a user's role (admin only)
func (s *Service) UpdateUserRole(userID string, role Role) error {
	err := s.repo.UpdateUserRole(userID, role)
	if err != nil {
		return err
	}

	// Get user to sync updated metadata to Clerk
	user, err := s.repo.GetUserByID(userID)
	if err == nil {
		// Sync user metadata to Clerk (best effort - don't fail update if sync fails)
		syncErr := SyncUserMetadataToClerk(userID, role, user.OrganizationName)
		if syncErr != nil {
			// Log the error but don't fail - DB is source of truth
			// TODO: In future, publish to GCP Pub/Sub for async retry
			_ = syncErr
		}
	}

	return nil
}
