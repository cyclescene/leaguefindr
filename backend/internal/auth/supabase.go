package auth

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/golang-jwt/jwt/v5"
)

// SupabaseTokenClaims represents the custom claims for Supabase JWT tokens
type SupabaseTokenClaims struct {
	// Standard JWT claims
	jwt.RegisteredClaims

	// Custom claims
	Sub   string `json:"sub"`   // Subject (user ID)
	Email string `json:"email"` // User email
	Role  string `json:"role"`  // User role (user, admin)
}

// GenerateSupabaseToken generates a Supabase-compatible JWT token
// This allows the frontend to use Supabase client for real-time subscriptions
// The token contains user claims fetched from Clerk and our database
// RLS policies will handle organization access based on user_organizations membership
// Admins have access to all organizations via their role claim
func GenerateSupabaseToken(userID string, service *Service) (string, error) {
	// Get Supabase JWT secret from environment
	supabaseJWTSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if supabaseJWTSecret == "" {
		slog.Error("SUPABASE_JWT_SECRET not set")
		return "", fmt.Errorf("SUPABASE_JWT_SECRET environment variable is required")
	}

	// Get user from our database to retrieve role
	user, err := service.GetUser(userID)
	if err != nil {
		slog.Error("failed to get user from database", "userID", userID, "err", err)
		return "", fmt.Errorf("failed to get user: %w", err)
	}

	// Get email from Clerk using the user package
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	clerkUser, err := clerkuser.Get(ctx, userID)
	if err != nil {
		slog.Error("failed to get user from clerk", "userID", userID, "err", err)
		return "", fmt.Errorf("failed to get user from clerk: %w", err)
	}

	email := ""
	if clerkUser.PrimaryEmailAddressID != nil && *clerkUser.PrimaryEmailAddressID != "" {
		// Use the primary email address ID to find the email
		primaryEmailID := *clerkUser.PrimaryEmailAddressID
		for _, emailAddr := range clerkUser.EmailAddresses {
			if emailAddr.ID == primaryEmailID {
				email = emailAddr.EmailAddress
				break
			}
		}
	}
	// If no primary email found, use the first one
	if email == "" && clerkUser.EmailAddresses != nil && len(clerkUser.EmailAddresses) > 0 {
		email = clerkUser.EmailAddresses[0].EmailAddress
	}

	// Create claims with a 1-hour expiration
	now := time.Now()
	claims := SupabaseTokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now),
			Issuer:    "https://supabase.io/auth/v1",
			Audience:  jwt.ClaimStrings{"authenticated"},
		},
		Sub:   userID,
		Email: email,
		Role:  user.Role.String(),
	}

	// Create token with HS256 algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token
	tokenString, err := token.SignedString([]byte(supabaseJWTSecret))
	if err != nil {
		slog.Error("failed to sign supabase token", "err", err)
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// SupabaseTokenResponse represents the response containing the Supabase token
type SupabaseTokenResponse struct {
	SupabaseToken string `json:"supabaseToken"`
	ExpiresIn     int    `json:"expiresIn"` // Seconds until expiration (3600)
}
