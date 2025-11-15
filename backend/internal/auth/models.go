package auth

import (
	"encoding/json"
	"time"
)

// Role represents user roles in the system
type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

// IsValid checks if the role is a valid role
func (r Role) IsValid() bool {
	switch r {
	case RoleUser, RoleAdmin:
		return true
	default:
		return false
	}
}

// String returns the string representation of the role
func (r Role) String() string {
	return string(r)
}

type User struct {
	ID        string     `json:"id"`
	Email     string     `json:"email"`
	Role      Role       `json:"role"`
	LastLogin *time.Time `json:"last_login"`
	LoginCount int       `json:"login_count"`
	IsActive  bool       `json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// UserOrganization represents the relationship between a user and an organization
type UserOrganization struct {
	ID        int       `json:"id"`
	UserID    string    `json:"user_id"`
	OrgID     int       `json:"org_id"`
	RoleInOrg string    `json:"role_in_org"` // owner, admin, member
	IsActive  bool      `json:"is_active"`
	JoinedAt  time.Time `json:"joined_at"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UnmarshalJSON implements custom JSON unmarshaling for User
func (u *User) UnmarshalJSON(data []byte) error {
	type Alias User
	aux := &struct {
		*Alias
	}{
		Alias: (*Alias)(u),
	}

	return json.Unmarshal(data, &aux)
}

// RegisterRequest represents a user signup request (account creation only)
type RegisterRequest struct {
	ClerkID string `json:"clerkID" validate:"required"`
	Email   string `json:"email" validate:"required,email"`
}

// OnboardingRequest represents the request to create an organization during onboarding
type OnboardingRequest struct {
	OrgName     string `json:"org_name" validate:"required,min=1,max=255"`
	OrgURL      string `json:"org_url" validate:"omitempty,url"`
	OrgEmail    string `json:"org_email" validate:"omitempty,email"`
	OrgPhone    string `json:"org_phone" validate:"omitempty"`
	OrgAddress  string `json:"org_address" validate:"omitempty"`
}

type LoginRequest struct {
	SessionID string `json:"sessionID" validate:"required"`
}

type UpdateRoleRequest struct {
	Role Role `json:"role" validate:"required"`
}

type ValidateTokenRequest struct {
	Token string `json:"token" validate:"required"`
}

type TokenResponse struct {
	Token string `json:"token"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}
