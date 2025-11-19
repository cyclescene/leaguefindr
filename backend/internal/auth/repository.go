package auth

import (
	"context"
	"fmt"

	"github.com/supabase-community/postgrest-go"
)

// RepositoryInterface defines the contract for repository implementations
type RepositoryInterface interface {
	CreateUser(ctx context.Context, userID, email string, role Role) error
	GetUserByID(ctx context.Context, userID string) (*User, error)
	UserExists(ctx context.Context, userID string) (bool, error)
	AdminExists(ctx context.Context) (bool, error)
	UpdateLastLogin(ctx context.Context, userID string) error
	UpdateUserRole(ctx context.Context, userID string, role Role) error
}

type Repository struct {
	client *postgrest.Client
}

func NewRepository(client *postgrest.Client) *Repository {
	return &Repository{client: client}
}

// CreateUser creates a new user in the database
func (r *Repository) CreateUser(ctx context.Context, userID, email string, role Role) error {
	insertData := map[string]interface{}{
		"id":        userID,
		"email":     email,
		"role":      role.String(),
		"is_active": true,
	}

	var result []map[string]interface{}
	_, err := r.client.From("users").
		Insert(insertData, true, "", "", "").
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetUserByID retrieves a user by ID
func (r *Repository) GetUserByID(ctx context.Context, userID string) (*User, error) {
	var users []User

	_, err := r.client.From("users").
		Select("*", "", false).
		Eq("id", userID).
		ExecuteToWithContext(ctx, &users)

	if err != nil || len(users) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	return &users[0], nil
}

// UserExists checks if a user exists by ID
func (r *Repository) UserExists(ctx context.Context, userID string) (bool, error) {
	var users []map[string]interface{}

	_, err := r.client.From("users").
		Select("id", "", false).
		Eq("id", userID).
		ExecuteToWithContext(ctx, &users)

	if err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}

	return len(users) > 0, nil
}

// AdminExists checks if any admin users exist in the database
func (r *Repository) AdminExists(ctx context.Context) (bool, error) {
	var users []map[string]interface{}

	_, err := r.client.From("users").
		Select("id", "", false).
		Eq("role", "admin").
		ExecuteToWithContext(ctx, &users)

	if err != nil {
		return false, fmt.Errorf("failed to check admin existence: %w", err)
	}

	return len(users) > 0, nil
}

// UpdateLastLogin updates the user's last login time and increments login count
func (r *Repository) UpdateLastLogin(ctx context.Context, userID string) error {
	updateData := map[string]interface{}{
		"last_login": "now()",
		"login_count": map[string]interface{}{
			"__increment": 1,
		},
	}

	var result []map[string]interface{}
	_, err := r.client.From("users").
		Update(updateData, "", "").
		Eq("id", userID).
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// UpdateUserRole updates a user's role
func (r *Repository) UpdateUserRole(ctx context.Context, userID string, role Role) error {
	updateData := map[string]interface{}{
		"role": role.String(),
	}

	var result []map[string]interface{}
	_, err := r.client.From("users").
		Update(updateData, "", "").
		Eq("id", userID).
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return fmt.Errorf("failed to update user role: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
