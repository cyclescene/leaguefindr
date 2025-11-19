package organizations

import (
	"context"
	"fmt"

	"github.com/supabase-community/postgrest-go"
)

type Service struct {
	baseClient *postgrest.Client
}

func NewService(baseClient *postgrest.Client) *Service {
	return &Service{
		baseClient: baseClient,
	}
}

// getClientWithAuth creates a new PostgREST client with JWT from context
func (s *Service) getClientWithAuth(ctx context.Context) *postgrest.Client {
	// For organizations, we use the base client as-is since it's public reference data
	// But we follow the same pattern for consistency
	return s.baseClient
}

// VerifyUserOrgAccess checks if user has access to organization
// Returns error if user doesn't have access
func (s *Service) VerifyUserOrgAccess(ctx context.Context, userID, orgID string) error {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)

	hasAccess, err := repo.UserHasAccessToOrg(ctx, userID, orgID)
	if err != nil {
		return err
	}

	if !hasAccess {
		return fmt.Errorf("user does not have access to this organization")
	}

	return nil
}

// GetUserOrganizations returns all organizations a user belongs to
func (s *Service) GetUserOrganizations(ctx context.Context, userID string) ([]Organization, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetUserOrganizations(ctx, userID)
}

// GetAllOrganizations returns all organizations (admin only)
func (s *Service) GetAllOrganizations(ctx context.Context) ([]Organization, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetAllOrganizations(ctx)
}

// CreateOrganization creates a new organization
func (s *Service) CreateOrganization(ctx context.Context, orgName, orgURL, orgEmail, orgPhone, orgAddress, createdBy string) (string, error) {
	if orgName == "" {
		return "", fmt.Errorf("organization name is required")
	}

	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)

	orgID, err := repo.CreateOrganization(ctx, orgName, orgURL, orgEmail, orgPhone, orgAddress, createdBy)
	if err != nil {
		return "", err
	}

	// Link the creator as owner
	err = repo.LinkUserToOrganization(ctx, createdBy, orgID, "owner")
	if err != nil {
		return "", fmt.Errorf("failed to link creator to organization: %w", err)
	}

	return orgID, nil
}

// JoinOrganization allows a user to join an organization (direct join for MVP)
func (s *Service) JoinOrganization(ctx context.Context, userID, orgID string) error {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)

	// Verify organization exists
	_, err := repo.GetOrganizationByID(ctx, orgID)
	if err != nil {
		return err
	}

	// Link user to organization as member
	return repo.LinkUserToOrganization(ctx, userID, orgID, "member")
}

// GetOrganizationByID retrieves an organization by ID
func (s *Service) GetOrganizationByID(ctx context.Context, orgID string) (*Organization, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetOrganizationByID(ctx, orgID)
}

// GetOrganizationMembers returns all members of an organization
func (s *Service) GetOrganizationMembers(ctx context.Context, orgID string) ([]UserOrganization, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.GetOrganizationMembers(ctx, orgID)
}

// IsUserOrgAdmin checks if user is admin or owner in organization
func (s *Service) IsUserOrgAdmin(ctx context.Context, userID, orgID string) (bool, error) {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.IsUserOrgAdmin(ctx, userID, orgID)
}

// RemoveUserFromOrganization removes a user from organization
func (s *Service) RemoveUserFromOrganization(ctx context.Context, userID, orgID string) error {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)
	return repo.RemoveUserFromOrganization(ctx, userID, orgID)
}

// UpdateOrganization updates organization details (admin/owner only)
func (s *Service) UpdateOrganization(ctx context.Context, userID, orgID string, orgName, orgURL, orgEmail, orgPhone, orgAddress *string) error {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)

	// Verify user is admin or owner
	isAdmin, err := repo.IsUserOrgAdmin(ctx, userID, orgID)
	if err != nil {
		return fmt.Errorf("failed to verify admin status: %w", err)
	}
	if !isAdmin {
		return fmt.Errorf("only admins and owners can update organization details")
	}

	// Verify at least one field is being updated
	if orgName == nil && orgURL == nil && orgEmail == nil && orgPhone == nil && orgAddress == nil {
		return fmt.Errorf("at least one field must be provided to update")
	}

	return repo.UpdateOrganization(ctx, orgID, orgName, orgURL, orgEmail, orgPhone, orgAddress)
}

// DeleteOrganization soft deletes an organization (owner only)
func (s *Service) DeleteOrganization(ctx context.Context, userID, orgID string) error {
	client := s.getClientWithAuth(ctx)
	repo := NewRepository(client)

	// Verify user is owner
	role, err := repo.GetUserOrgRole(ctx, userID, orgID)
	if err != nil {
		return fmt.Errorf("failed to verify ownership: %w", err)
	}
	if role != "owner" {
		return fmt.Errorf("only organization owner can delete the organization")
	}

	return repo.DeleteOrganization(ctx, orgID)
}
