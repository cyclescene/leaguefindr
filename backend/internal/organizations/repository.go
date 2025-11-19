package organizations

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/supabase-community/postgrest-go"
)

// RepositoryInterface defines the contract for organization repository
type RepositoryInterface interface {
	CreateOrganization(ctx context.Context, orgName, orgURL, orgEmail, orgPhone, orgAddress, createdBy string) (string, error)
	UserHasAccessToOrg(ctx context.Context, userID, orgID string) (bool, error)
	GetUserOrgRole(ctx context.Context, userID, orgID string) (string, error)
	GetUserOrganizations(ctx context.Context, userID string) ([]Organization, error)
	GetAllOrganizations(ctx context.Context) ([]Organization, error)
	LinkUserToOrganization(ctx context.Context, userID, orgID, roleInOrg string) error
	GetOrganizationByID(ctx context.Context, orgID string) (*Organization, error)
	GetOrganizationMembers(ctx context.Context, orgID string) ([]UserOrganization, error)
	IsUserOrgAdmin(ctx context.Context, userID, orgID string) (bool, error)
	RemoveUserFromOrganization(ctx context.Context, userID, orgID string) error
	UpdateOrganization(ctx context.Context, orgID string, orgName, orgURL, orgEmail, orgPhone, orgAddress *string) error
	DeleteOrganization(ctx context.Context, orgID string) error
}

type Repository struct {
	client *postgrest.Client
}

func NewRepository(client *postgrest.Client) *Repository {
	return &Repository{client: client}
}

// CreateOrganization creates a new organization and returns the UUID
func (r *Repository) CreateOrganization(ctx context.Context, orgName, orgURL, orgEmail, orgPhone, orgAddress, createdBy string) (string, error) {
	orgID := uuid.New().String()

	insertData := map[string]interface{}{
		"id":               orgID,
		"org_name":         orgName,
		"org_url":          orgURL,
		"org_email":        orgEmail,
		"org_phone_number": orgPhone,
		"org_address":      orgAddress,
		"created_by":       createdBy,
	}

	var result []map[string]interface{}
	_, err := r.client.From("organizations").
		Insert(insertData, true, "", "", "").
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return "", fmt.Errorf("failed to create organization: %w", err)
	}

	return orgID, nil
}

// UserHasAccessToOrg checks if a user has active access to an organization
func (r *Repository) UserHasAccessToOrg(ctx context.Context, userID, orgID string) (bool, error) {
	var userOrgs []UserOrganization

	_, err := r.client.From("user_organizations").
		Select("*", "", false).
		Eq("user_id", userID).
		Eq("org_id", orgID).
		Eq("is_active", "true").
		ExecuteToWithContext(ctx, &userOrgs)

	if err != nil {
		return false, fmt.Errorf("failed to check user org access: %w", err)
	}

	return len(userOrgs) > 0, nil
}

// GetUserOrgRole returns the user's role in an organization
func (r *Repository) GetUserOrgRole(ctx context.Context, userID, orgID string) (string, error) {
	var userOrgs []UserOrganization

	_, err := r.client.From("user_organizations").
		Select("*", "", false).
		Eq("user_id", userID).
		Eq("org_id", orgID).
		Eq("is_active", "true").
		ExecuteToWithContext(ctx, &userOrgs)

	if err != nil || len(userOrgs) == 0 {
		return "", fmt.Errorf("user does not have access to this organization")
	}

	return userOrgs[0].RoleInOrg, nil
}

// GetUserOrganizations returns all organizations a user belongs to (active only)
func (r *Repository) GetUserOrganizations(ctx context.Context, userID string) ([]Organization, error) {
	// PostgREST doesn't support traditional JOINs, so we fetch user_organizations first
	var userOrgs []map[string]interface{}

	_, err := r.client.From("user_organizations").
		Select("org_id", "", false).
		Eq("user_id", userID).
		Eq("is_active", "true").
		ExecuteToWithContext(ctx, &userOrgs)

	if err != nil {
		return nil, fmt.Errorf("failed to get user organizations: %w", err)
	}

	if len(userOrgs) == 0 {
		return []Organization{}, nil
	}

	// Extract org IDs
	var orgIDs []string
	for _, uo := range userOrgs {
		if oid, ok := uo["org_id"].(string); ok {
			orgIDs = append(orgIDs, oid)
		}
	}

	// Now fetch all organizations that the user is a member of
	// For multiple org IDs, we need to fetch them one by one or use a workaround
	// For now, fetch all non-deleted orgs and filter in memory
	var allOrgs []Organization
	_, err = r.client.From("organizations").
		Select("*", "", false).
		Eq("is_deleted", "false").
		ExecuteToWithContext(ctx, &allOrgs)

	if err != nil {
		return nil, fmt.Errorf("failed to get organizations: %w", err)
	}

	// Filter organizations to only those the user is a member of
	orgIDMap := make(map[string]bool)
	for _, oid := range orgIDs {
		orgIDMap[oid] = true
	}

	var userOrgsList []Organization
	for _, org := range allOrgs {
		if orgIDMap[org.ID] {
			userOrgsList = append(userOrgsList, org)
		}
	}

	return userOrgsList, nil
}

// GetAllOrganizations returns all organizations (admin only)
func (r *Repository) GetAllOrganizations(ctx context.Context) ([]Organization, error) {
	var orgs []Organization

	_, err := r.client.From("organizations").
		Select("*", "", false).
		Eq("is_deleted", "false").
		ExecuteToWithContext(ctx, &orgs)

	if err != nil {
		return nil, fmt.Errorf("failed to get organizations: %w", err)
	}

	if orgs == nil {
		orgs = []Organization{}
	}

	return orgs, nil
}

// LinkUserToOrganization creates or updates a user-organization relationship
func (r *Repository) LinkUserToOrganization(ctx context.Context, userID, orgID, roleInOrg string) error {
	// First, try to check if the relationship exists
	var existing []UserOrganization

	_, err := r.client.From("user_organizations").
		Select("*", "", false).
		Eq("user_id", userID).
		Eq("org_id", orgID).
		ExecuteToWithContext(ctx, &existing)

	if err != nil {
		return fmt.Errorf("failed to check existing link: %w", err)
	}

	if len(existing) > 0 {
		// Update existing link
		updateData := map[string]interface{}{
			"is_active":    true,
			"role_in_org":  roleInOrg,
			"updated_at":   "now()", // PostgREST will handle this
		}

		_, err := r.client.From("user_organizations").
			Update(updateData, "", "").
			Eq("user_id", userID).
			Eq("org_id", orgID).
			ExecuteToWithContext(ctx, &[]map[string]interface{}{})

		if err != nil {
			return fmt.Errorf("failed to update user-organization link: %w", err)
		}
	} else {
		// Create new link
		insertData := map[string]interface{}{
			"user_id":    userID,
			"org_id":     orgID,
			"role_in_org": roleInOrg,
			"is_active":  true,
		}

		_, err := r.client.From("user_organizations").
			Insert(insertData, true, "", "", "").
			ExecuteToWithContext(ctx, &[]map[string]interface{}{})

		if err != nil {
			return fmt.Errorf("failed to link user to organization: %w", err)
		}
	}

	return nil
}

// GetOrganizationByID retrieves a single organization by ID
func (r *Repository) GetOrganizationByID(ctx context.Context, orgID string) (*Organization, error) {
	var orgs []Organization

	_, err := r.client.From("organizations").
		Select("*", "", false).
		Eq("id", orgID).
		Eq("is_deleted", "false").
		ExecuteToWithContext(ctx, &orgs)

	if err != nil || len(orgs) == 0 {
		return nil, fmt.Errorf("organization not found")
	}

	return &orgs[0], nil
}

// GetOrganizationMembers returns all active members of an organization
func (r *Repository) GetOrganizationMembers(ctx context.Context, orgID string) ([]UserOrganization, error) {
	var members []UserOrganization

	_, err := r.client.From("user_organizations").
		Select("*", "", false).
		Eq("org_id", orgID).
		Eq("is_active", "true").
		ExecuteToWithContext(ctx, &members)

	if err != nil {
		return nil, fmt.Errorf("failed to get organization members: %w", err)
	}

	if members == nil {
		members = []UserOrganization{}
	}

	return members, nil
}

// IsUserOrgAdmin checks if a user is an owner or admin in an organization
func (r *Repository) IsUserOrgAdmin(ctx context.Context, userID, orgID string) (bool, error) {
	var userOrgs []UserOrganization

	_, err := r.client.From("user_organizations").
		Select("*", "", false).
		Eq("user_id", userID).
		Eq("org_id", orgID).
		Eq("is_active", "true").
		ExecuteToWithContext(ctx, &userOrgs)

	if err != nil {
		return false, fmt.Errorf("failed to check admin status: %w", err)
	}

	if len(userOrgs) == 0 {
		return false, nil
	}

	role := userOrgs[0].RoleInOrg
	return role == "owner" || role == "admin", nil
}

// RemoveUserFromOrganization deactivates a user from an organization
func (r *Repository) RemoveUserFromOrganization(ctx context.Context, userID, orgID string) error {
	updateData := map[string]interface{}{
		"is_active": false,
	}

	var result []map[string]interface{}
	_, err := r.client.From("user_organizations").
		Update(updateData, "", "").
		Eq("user_id", userID).
		Eq("org_id", orgID).
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return fmt.Errorf("failed to remove user from organization: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("user is not a member of this organization")
	}

	return nil
}

// UpdateOrganization updates organization details
func (r *Repository) UpdateOrganization(ctx context.Context, orgID string, orgName, orgURL, orgEmail, orgPhone, orgAddress *string) error {
	updateData := map[string]interface{}{}

	if orgName != nil {
		updateData["org_name"] = *orgName
	}
	if orgURL != nil {
		updateData["org_url"] = *orgURL
	}
	if orgEmail != nil {
		updateData["org_email"] = *orgEmail
	}
	if orgPhone != nil {
		updateData["org_phone_number"] = *orgPhone
	}
	if orgAddress != nil {
		updateData["org_address"] = *orgAddress
	}

	var result []map[string]interface{}
	_, err := r.client.From("organizations").
		Update(updateData, "", "").
		Eq("id", orgID).
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return fmt.Errorf("failed to update organization: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("organization not found")
	}

	return nil
}

// DeleteOrganization soft deletes an organization by setting is_deleted
func (r *Repository) DeleteOrganization(ctx context.Context, orgID string) error {
	updateData := map[string]interface{}{
		"is_deleted": true,
	}

	var result []map[string]interface{}
	_, err := r.client.From("organizations").
		Update(updateData, "", "").
		Eq("id", orgID).
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return fmt.Errorf("failed to delete organization: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("organization not found")
	}

	return nil
}
