package auth

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/supabase-community/postgrest-go"
)

type Service struct {
	baseClient    *postgrest.Client
	serviceClient *postgrest.Client
	baseURL       string
	anonKey       string
}

func NewService(baseClient *postgrest.Client, serviceClient *postgrest.Client) *Service {
	return &Service{
		baseClient:    baseClient,
		serviceClient: serviceClient,
	}
}

// NewServiceWithConfig creates a new auth service with Supabase config
func NewServiceWithConfig(baseClient *postgrest.Client, serviceClient *postgrest.Client, baseURL string, anonKey string) *Service {
	return &Service{
		baseClient:    baseClient,
		serviceClient: serviceClient,
		baseURL:       baseURL,
		anonKey:       anonKey,
	}
}

// getClientWithAuth creates a new PostgREST client with JWT from context
func (s *Service) getClientWithAuth(ctx context.Context) *postgrest.Client {
	// Extract JWT token from context (set by JWT middleware)
	token := ""
	if jwtVal := ctx.Value("jwt_token"); jwtVal != nil {
		if t, ok := jwtVal.(string); ok {
			token = t
		}
	}

	// If we have config, create a new client with JWT
	if s.baseURL != "" && s.anonKey != "" {
		client := postgrest.NewClient(
			s.baseURL,
			"public",
			map[string]string{
				"apikey": s.anonKey,
			},
		)

		// Set JWT token if present (this adds it to Authorization header)
		if token != "" {
			client.SetAuthToken(token)
		}

		return client
	}

	// Fallback to base client for backwards compatibility
	return s.baseClient
}

// RegisterUser creates a new user account (no organization assignment)
// User will create or join an organization during onboarding via frontend
// Returns isAdmin boolean indicating if this user was made an admin
func (s *Service) RegisterUser(ctx context.Context, clerkID, email string) (bool, error) {
	// Use service client for all operations
	repo := NewRepository(s.serviceClient)

	// Check if user already exists
	exists, err := repo.UserExists(ctx, clerkID)
	if err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}

	// User already exists
	if exists {
		return false, fmt.Errorf("user already exists")
	}

	// Determine role: first user is admin, others are organizers
	role := RoleOrganizer
	adminExists, err := repo.AdminExists(ctx)
	if err != nil {
		slog.Error("failed to check admin existence", "clerkID", clerkID, "err", err)
		return false, fmt.Errorf("failed to check admin existence: %w", err)
	}
	slog.Info("admin existence check", "clerkID", clerkID, "adminExists", adminExists)

	isAdmin := false
	if !adminExists {
		role = RoleAdmin
		isAdmin = true
	}

	// Create new user
	err = repo.CreateUser(ctx, clerkID, email, role)
	if err != nil {
		return false, err
	}

	// Note: Email verification is always required for all users, including admins
	// Users verify via email code during signup flow

	// Sync user metadata to Clerk (best effort - don't fail registration if sync fails)
	syncErr := SyncUserMetadataToClerk(clerkID, role)
	if syncErr != nil {
		// Log the error but don't fail - DB is source of truth
		// TODO: In future, publish to GCP Pub/Sub for async retry
		_ = syncErr
	}

	return isAdmin, nil
}

// GetUser retrieves user information by ID
func (s *Service) GetUser(ctx context.Context, userID string) (*User, error) {
	repo := NewRepository(s.serviceClient)

	user, err := repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// ValidateUserRole checks if a user has a specific role
func (s *Service) ValidateUserRole(ctx context.Context, userID string, requiredRole Role) (bool, error) {
	repo := NewRepository(s.serviceClient)

	user, err := repo.GetUserByID(ctx, userID)
	if err != nil {
		return false, err
	}

	if !user.IsActive {
		return false, fmt.Errorf("user account is inactive")
	}

	return user.Role == requiredRole, nil
}

// RecordLogin updates user's last login time and increments login count
func (s *Service) RecordLogin(ctx context.Context, userID string) error {
	repo := NewRepository(s.serviceClient)

	err := repo.UpdateLastLogin(ctx, userID)
	if err != nil {
		return err
	}

	return nil
}

// UpdateUserRole updates a user's role (admin only)
func (s *Service) UpdateUserRole(ctx context.Context, userID string, role Role) error {
	repo := NewRepository(s.serviceClient)

	err := repo.UpdateUserRole(ctx, userID, role)
	if err != nil {
		return err
	}

	// Sync user metadata to Clerk (best effort - don't fail update if sync fails)
	syncErr := SyncUserMetadataToClerk(userID, role)
	if syncErr != nil {
		// Log the error but don't fail - DB is source of truth
		// TODO: In future, publish to GCP Pub/Sub for async retry
		slog.Error("failed to sync user metadata to Clerk", "userID", userID, "err", syncErr)
	}

	return nil
}

// IsUserAdmin checks if a user has admin role
// If user doesn't exist, returns false (not admin) instead of erroring
func (s *Service) IsUserAdmin(ctx context.Context, userID string) (bool, error) {
	repo := NewRepository(s.serviceClient)

	user, err := repo.GetUserByID(ctx, userID)
	if err != nil {
		// User doesn't exist - return false, don't error
		// The user will need to call /auth/register to create their account
		slog.Debug("IsUserAdmin: user not found in database", "userID", userID)
		return false, nil
	}
	return user.Role == RoleAdmin, nil
}
