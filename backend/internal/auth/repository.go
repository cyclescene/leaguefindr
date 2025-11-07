package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RepositoryInterface defines the contract for repository implementations
type RepositoryInterface interface {
	CreateUser(userID, email string, role Role) error
	GetUserByID(userID string) (*User, error)
	UserExists(userID string) (bool, error)
	AdminExists() (bool, error)
	UpdateLastLogin(userID string) error
	UpdateUserRole(userID string, role Role) error
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// CreateUser creates a new user in the database (without organization assignment)
func (r *Repository) CreateUser(userID, email string, role Role) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO users (id, email, role, is_active)
		VALUES ($1, $2, $3, $4)
	`

	_, err := r.db.Exec(ctx, query, userID, email, role.String(), true)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetUserByID retrieves a user by ID
func (r *Repository) GetUserByID(userID string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	user := &User{}

	query := `
		SELECT id, email, role, is_active, login_count, created_at, updated_at, last_login, currently_logged_in
		FROM users
		WHERE id = $1
	`

	err := r.db.QueryRow(ctx, query, userID).
		Scan(&user.ID, &user.Email, &user.Role, &user.IsActive, &user.LoginCount, &user.CreatedAt, &user.UpdatedAt, &user.LastLogin, &user.CurrentlyLoggedIn)

	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	return user, nil
}

// UserExists checks if a user exists by ID
func (r *Repository) UserExists(userID string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var exists bool

	query := `SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)`
	err := r.db.QueryRow(ctx, query, userID).Scan(&exists)

	if err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}

	return exists, nil
}

// AdminExists checks if any admin users exist in the database
func (r *Repository) AdminExists() (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var exists bool

	query := `SELECT EXISTS(SELECT 1 FROM users WHERE role = 'admin')`
	err := r.db.QueryRow(ctx, query).Scan(&exists)

	if err != nil {
		return false, fmt.Errorf("failed to check admin existence: %w", err)
	}

	return exists, nil
}

// UpdateLastLogin updates the user's last login time and increments login count
func (r *Repository) UpdateLastLogin(userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE users
		SET last_login = NOW(), login_count = login_count + 1, updated_at = NOW()
		WHERE id = $1
	`

	result, err := r.db.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// UpdateUserRole updates a user's role
func (r *Repository) UpdateUserRole(userID string, role Role) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE users
		SET role = $1, updated_at = NOW()
		WHERE id = $2
	`

	result, err := r.db.Exec(ctx, query, role.String(), userID)
	if err != nil {
		return fmt.Errorf("failed to update user role: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}
