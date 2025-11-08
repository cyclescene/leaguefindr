package organizations

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RepositoryInterface defines the contract for organization repository
type RepositoryInterface interface {
	CreateOrganization(orgName, orgURL, orgEmail, orgPhone, orgAddress, createdBy string) (string, error)
	UserHasAccessToOrg(userID, orgID string) (bool, error)
	GetUserOrgRole(userID, orgID string) (string, error)
	GetUserOrganizations(userID string) ([]Organization, error)
	GetAllOrganizations() ([]Organization, error)
	LinkUserToOrganization(userID, orgID, roleInOrg string) error
	GetOrganizationByID(orgID string) (*Organization, error)
	GetOrganizationMembers(orgID string) ([]UserOrganization, error)
	IsUserOrgAdmin(userID, orgID string) (bool, error)
	RemoveUserFromOrganization(userID, orgID string) error
	UpdateOrganization(orgID string, orgName, orgURL, orgEmail, orgPhone, orgAddress *string) error
	DeleteOrganization(orgID string) error
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// CreateOrganization creates a new organization and returns the UUID
func (r *Repository) CreateOrganization(orgName, orgURL, orgEmail, orgPhone, orgAddress, createdBy string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	orgID := uuid.New().String()

	query := `
		INSERT INTO organizations (id, org_name, org_url, org_email, org_phone_number, org_address, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := r.db.Exec(ctx, query, orgID, orgName, orgURL, orgEmail, orgPhone, orgAddress, createdBy)
	if err != nil {
		return "", fmt.Errorf("failed to create organization: %w", err)
	}

	return orgID, nil
}

// UserHasAccessToOrg checks if a user has active access to an organization
func (r *Repository) UserHasAccessToOrg(userID, orgID string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var exists bool

	query := `
		SELECT EXISTS(
			SELECT 1 FROM user_organizations
			WHERE user_id = $1 AND org_id = $2 AND is_active = true
		)
	`

	err := r.db.QueryRow(ctx, query, userID, orgID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check user org access: %w", err)
	}

	return exists, nil
}

// GetUserOrgRole returns the user's role in an organization
func (r *Repository) GetUserOrgRole(userID, orgID string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var role string

	query := `
		SELECT role_in_org FROM user_organizations
		WHERE user_id = $1 AND org_id = $2 AND is_active = true
	`

	err := r.db.QueryRow(ctx, query, userID, orgID).Scan(&role)
	if err != nil {
		return "", fmt.Errorf("user does not have access to this organization")
	}

	return role, nil
}

// GetUserOrganizations returns all organizations a user belongs to (active only)
func (r *Repository) GetUserOrganizations(userID string) ([]Organization, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var orgs []Organization

	query := `
		SELECT o.id, o.org_name, o.org_url, o.org_email, o.org_phone_number, o.org_address, o.created_by, o.is_deleted, o.deleted_at, o.created_at, o.updated_at
		FROM organizations o
		INNER JOIN user_organizations uo ON o.id = uo.org_id
		WHERE uo.user_id = $1 AND uo.is_active = true AND o.is_deleted = false
		ORDER BY o.created_at DESC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user organizations: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var org Organization
		err := rows.Scan(&org.ID, &org.OrgName, &org.OrgURL, &org.OrgEmail, &org.OrgPhone, &org.OrgAddress, &org.CreatedBy, &org.IsDeleted, &org.DeletedAt, &org.CreatedAt, &org.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan organization: %w", err)
		}
		orgs = append(orgs, org)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating organizations: %w", err)
	}

	return orgs, nil
}

// GetAllOrganizations returns all organizations (admin only)
func (r *Repository) GetAllOrganizations() ([]Organization, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var orgs []Organization

	query := `
		SELECT id, org_name, org_url, org_email, org_phone_number, org_address, created_by, is_deleted, deleted_at, created_at, updated_at
		FROM organizations
		WHERE is_deleted = false
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get organizations: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var org Organization
		err := rows.Scan(&org.ID, &org.OrgName, &org.OrgURL, &org.OrgEmail, &org.OrgPhone, &org.OrgAddress, &org.CreatedBy, &org.IsDeleted, &org.DeletedAt, &org.CreatedAt, &org.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan organization: %w", err)
		}
		orgs = append(orgs, org)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating organizations: %w", err)
	}

	return orgs, nil
}

// LinkUserToOrganization creates a user-organization relationship (direct join for MVP)
func (r *Repository) LinkUserToOrganization(userID, orgID, roleInOrg string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO user_organizations (user_id, org_id, role_in_org, is_active)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT(user_id, org_id) DO UPDATE SET
			is_active = true,
			role_in_org = $3,
			updated_at = NOW()
	`

	_, err := r.db.Exec(ctx, query, userID, orgID, roleInOrg, true)
	if err != nil {
		return fmt.Errorf("failed to link user to organization: %w", err)
	}

	return nil
}

// GetOrganizationByID retrieves a single organization by ID
func (r *Repository) GetOrganizationByID(orgID string) (*Organization, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	org := &Organization{}

	query := `
		SELECT id, org_name, org_url, org_email, org_phone_number, org_address, created_by, is_deleted, deleted_at, created_at, updated_at
		FROM organizations
		WHERE id = $1 AND is_deleted = false
	`

	err := r.db.QueryRow(ctx, query, orgID).Scan(
		&org.ID, &org.OrgName, &org.OrgURL, &org.OrgEmail, &org.OrgPhone, &org.OrgAddress, &org.CreatedBy, &org.IsDeleted, &org.DeletedAt, &org.CreatedAt, &org.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("organization not found")
	}

	return org, nil
}

// GetOrganizationMembers returns all active members of an organization
func (r *Repository) GetOrganizationMembers(orgID string) ([]UserOrganization, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var members []UserOrganization

	query := `
		SELECT id, user_id, org_id, role_in_org, is_active, joined_at, created_at, updated_at
		FROM user_organizations
		WHERE org_id = $1 AND is_active = true
		ORDER BY joined_at DESC
	`

	rows, err := r.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, fmt.Errorf("failed to get organization members: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var member UserOrganization
		err := rows.Scan(
			&member.ID, &member.UserID, &member.OrgID, &member.RoleInOrg, &member.IsActive, &member.JoinedAt, &member.CreatedAt, &member.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan member: %w", err)
		}
		members = append(members, member)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating members: %w", err)
	}

	return members, nil
}

// IsUserOrgAdmin checks if a user is an owner or admin in an organization
func (r *Repository) IsUserOrgAdmin(userID, orgID string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var isAdmin bool

	query := `
		SELECT EXISTS(
			SELECT 1 FROM user_organizations
			WHERE user_id = $1 AND org_id = $2 AND is_active = true
			AND role_in_org IN ('owner', 'admin')
		)
	`

	err := r.db.QueryRow(ctx, query, userID, orgID).Scan(&isAdmin)
	if err != nil {
		return false, fmt.Errorf("failed to check admin status: %w", err)
	}

	return isAdmin, nil
}

// RemoveUserFromOrganization deactivates a user from an organization
func (r *Repository) RemoveUserFromOrganization(userID, orgID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE user_organizations
		SET is_active = false, updated_at = NOW()
		WHERE user_id = $1 AND org_id = $2
	`

	result, err := r.db.Exec(ctx, query, userID, orgID)
	if err != nil {
		return fmt.Errorf("failed to remove user from organization: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("user is not a member of this organization")
	}

	return nil
}

// UpdateOrganization updates organization details
func (r *Repository) UpdateOrganization(orgID string, orgName, orgURL, orgEmail, orgPhone, orgAddress *string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE organizations
		SET
			org_name = COALESCE($1, org_name),
			org_url = COALESCE($2, org_url),
			org_email = COALESCE($3, org_email),
			org_phone_number = COALESCE($4, org_phone_number),
			org_address = COALESCE($5, org_address),
			updated_at = NOW()
		WHERE id = $6
	`

	result, err := r.db.Exec(ctx, query, orgName, orgURL, orgEmail, orgPhone, orgAddress, orgID)
	if err != nil {
		return fmt.Errorf("failed to update organization: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("organization not found")
	}

	return nil
}

// DeleteOrganization soft deletes an organization by setting is_deleted and deleted_at
func (r *Repository) DeleteOrganization(orgID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE organizations
		SET is_deleted = true, deleted_at = NOW(), updated_at = NOW()
		WHERE id = $1
	`

	result, err := r.db.Exec(ctx, query, orgID)
	if err != nil {
		return fmt.Errorf("failed to delete organization: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("organization not found")
	}

	return nil
}
