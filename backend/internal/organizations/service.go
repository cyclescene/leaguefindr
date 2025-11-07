package organizations

import (
	"fmt"
)

type Service struct {
	repo RepositoryInterface
}

func NewService(repo RepositoryInterface) *Service {
	return &Service{repo: repo}
}

// VerifyUserOrgAccess checks if user has access to organization
// Returns error if user doesn't have access
func (s *Service) VerifyUserOrgAccess(userID, orgID string) error {
	hasAccess, err := s.repo.UserHasAccessToOrg(userID, orgID)
	if err != nil {
		return err
	}

	if !hasAccess {
		return fmt.Errorf("user does not have access to this organization")
	}

	return nil
}

// GetUserOrganizations returns all organizations a user belongs to
func (s *Service) GetUserOrganizations(userID string) ([]Organization, error) {
	return s.repo.GetUserOrganizations(userID)
}

// GetAllOrganizations returns all organizations (admin only)
func (s *Service) GetAllOrganizations() ([]Organization, error) {
	return s.repo.GetAllOrganizations()
}

// CreateOrganization creates a new organization
func (s *Service) CreateOrganization(orgName, orgURL, orgEmail, orgPhone, orgAddress, createdBy string) (string, error) {
	if orgName == "" {
		return "", fmt.Errorf("organization name is required")
	}

	orgID, err := s.repo.CreateOrganization(orgName, orgURL, orgEmail, orgPhone, orgAddress, createdBy)
	if err != nil {
		return "", err
	}

	// Link the creator as owner
	err = s.repo.LinkUserToOrganization(createdBy, orgID, "owner")
	if err != nil {
		return "", fmt.Errorf("failed to link creator to organization: %w", err)
	}

	return orgID, nil
}

// JoinOrganization allows a user to join an organization (direct join for MVP)
func (s *Service) JoinOrganization(userID, orgID string) error {
	// Verify organization exists
	_, err := s.repo.GetOrganizationByID(orgID)
	if err != nil {
		return err
	}

	// Link user to organization as member
	return s.repo.LinkUserToOrganization(userID, orgID, "member")
}

// GetOrganizationByID retrieves an organization by ID
func (s *Service) GetOrganizationByID(orgID string) (*Organization, error) {
	return s.repo.GetOrganizationByID(orgID)
}

// GetOrganizationMembers returns all members of an organization
func (s *Service) GetOrganizationMembers(orgID string) ([]UserOrganization, error) {
	return s.repo.GetOrganizationMembers(orgID)
}

// IsUserOrgAdmin checks if user is admin or owner in organization
func (s *Service) IsUserOrgAdmin(userID, orgID string) (bool, error) {
	return s.repo.IsUserOrgAdmin(userID, orgID)
}

// RemoveUserFromOrganization removes a user from organization
func (s *Service) RemoveUserFromOrganization(userID, orgID string) error {
	return s.repo.RemoveUserFromOrganization(userID, orgID)
}
