package organizations

import (
	"github.com/leaguefindr/backend/internal/shared"
)

// Organization represents an organization
type Organization struct {
	ID        string             `json:"id"`       // UUID
	OrgName   string             `json:"org_name"`
	OrgURL    *string            `json:"org_url"`
	OrgEmail  *string            `json:"org_email"`
	OrgPhone  *string            `json:"org_phone"`
	OrgAddress *string           `json:"org_address"`
	CreatedBy *string            `json:"created_by"` // User ID who created it
	IsDeleted bool               `json:"is_deleted"`
	DeletedAt *shared.Timestamp  `json:"deleted_at"` // Nullable since not all orgs are deleted
	CreatedAt shared.Timestamp   `json:"created_at"`
	UpdatedAt shared.Timestamp   `json:"updated_at"`
}

// UserOrganization represents the relationship between a user and organization
type UserOrganization struct {
	ID        int               `json:"id"`
	UserID    string            `json:"user_id"`
	OrgID     string            `json:"org_id"`
	RoleInOrg string            `json:"role_in_org"` // owner, admin, member
	IsActive  bool              `json:"is_active"`
	JoinedAt  shared.Timestamp  `json:"joined_at"`
	CreatedAt shared.Timestamp  `json:"created_at"`
	UpdatedAt shared.Timestamp  `json:"updated_at"`
}

// CreateOrganizationRequest represents a request to create an organization
type CreateOrganizationRequest struct {
	OrgName    string `json:"org_name" validate:"required,min=1,max=255"`
	OrgURL     string `json:"org_url" validate:"required,min=1"`
	OrgEmail   *string `json:"org_email" validate:"omitempty,email"`
	OrgPhone   *string `json:"org_phone" validate:"omitempty"`
	OrgAddress *string `json:"org_address" validate:"omitempty"`
}

// JoinOrganizationRequest represents a request to join an organization
type JoinOrganizationRequest struct {
	OrgID string `json:"org_id" validate:"required,uuid"`
}

// UpdateOrganizationRequest represents a request to update organization details
type UpdateOrganizationRequest struct {
	OrgName    *string `json:"org_name" validate:"omitempty,min=1,max=255"`
	OrgURL     *string `json:"org_url" validate:"omitempty,url"`
	OrgEmail   *string `json:"org_email" validate:"omitempty,email"`
	OrgPhone   *string `json:"org_phone" validate:"omitempty"`
	OrgAddress *string `json:"org_address" validate:"omitempty"`
}
