package auth

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	clerk "github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/clerk/clerk-sdk-go/v2/session"
)

// JWTMiddleware validates Clerk JWT tokens from the Authorization header
// It extracts the user ID and stores it in the X-Clerk-User-ID header for downstream handlers
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			slog.Debug("JWTMiddleware: missing authorization header")
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			slog.Debug("JWTMiddleware: invalid authorization header format")
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		token := parts[1]

		// Verify token with Clerk SDK
		claims, err := verifyClerkToken(r.Context(), token)
		if err != nil {
			slog.Error("JWTMiddleware: token verification failed",
				"error", err.Error(),
				"tokenLength", len(token),
			)
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		slog.Info("JWTMiddleware: token verified successfully",
			"userID", claims.Sub,
		)

		// Store user ID in request header for downstream handlers
		r.Header.Set("X-Clerk-User-ID", claims.Sub)

		next.ServeHTTP(w, r)
	})
}

// verifyClerkToken verifies the JWT token using the Clerk SDK
// It extracts and returns the user ID from the token claims
func verifyClerkToken(ctx context.Context, token string) (*TokenClaims, error) {
	// Create a context with timeout for the verification
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Decode the token to extract claims without verification first
	claims, err := jwt.Decode(ctx, &jwt.DecodeParams{
		Token: token,
	})
	if err != nil {
		slog.Error("verifyClerkToken: decode error", "err", err)
		return nil, fmt.Errorf("failed to decode token: %w", err)
	}

	// Get the JSON Web Key for verification
	jwk, err := jwt.GetJSONWebKey(ctx, &jwt.GetJSONWebKeyParams{
		KeyID: claims.KeyID,
	})
	if err != nil {
		if apiErr, ok := err.(*clerk.APIErrorResponse); ok {
			slog.Error("verifyClerkToken: JWK fetch error",
				"statusCode", apiErr.HTTPStatusCode,
				"traceID", apiErr.TraceID,
				"err", err)
			return nil, fmt.Errorf("jwk fetch failed (trace: %s): %w", apiErr.TraceID, err)
		}

		slog.Error("verifyClerkToken: JWK fetch error", "err", err)
		return nil, fmt.Errorf("failed to fetch JWK: %w", err)
	}

	// Verify the token signature
	verifiedClaims, err := jwt.Verify(ctx, &jwt.VerifyParams{
		Token: token,
		JWK:   jwk,
	})
	if err != nil {
		slog.Error("verifyClerkToken: verification error", "err", err)
		return nil, fmt.Errorf("token verification failed: %w", err)
	}

	// Extract user ID from claims
	// The Subject field contains the Clerk user ID
	userID := verifiedClaims.Subject
	if userID == "" {
		slog.Error("verifyClerkToken: missing or invalid sub claim")
		return nil, fmt.Errorf("invalid token: missing user ID claim")
	}

	slog.Debug("verifyClerkToken: success", "userID", userID)
	return &TokenClaims{Sub: userID}, nil
}

// TokenClaims represents the essential claims from a Clerk JWT token
type TokenClaims struct {
	Sub string // User ID (subject)
}

// RequireAdmin is a middleware that checks if the user has admin role
// It expects the X-Clerk-User-ID header to be set by JWTMiddleware
func RequireAdmin(authService *Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get user ID from the header set by JWT middleware
			userID := r.Header.Get("X-Clerk-User-ID")
			if userID == "" {
				slog.Warn("RequireAdmin: missing X-Clerk-User-ID header")
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Check if user is admin
			isAdmin, err := authService.IsUserAdmin(userID)
			if err != nil || !isAdmin {
				slog.Warn("RequireAdmin: admin check failed", "userID", userID, "err", err)
				http.Error(w, "Forbidden: admin access required", http.StatusForbidden)
				return
			}

			// User is admin, proceed to next handler
			next.ServeHTTP(w, r)
		})
	}
}

// GetUserIDFromSessionID retrieves the Clerk user ID from a session ID using the Clerk SDK
func GetUserIDFromSessionID(sessionID string) (string, error) {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get session using Clerk SDK
	sess, err := session.Get(ctx, sessionID)
	if err != nil {
		// Check if it's an API error for better error handling
		if apiErr, ok := err.(*clerk.APIErrorResponse); ok {
			slog.Error("GetUserIDFromSessionID: Clerk API error",
				"sessionID", sessionID,
				"statusCode", apiErr.HTTPStatusCode,
				"traceID", apiErr.TraceID,
				"err", err)
			return "", fmt.Errorf("session lookup failed (trace: %s): %w", apiErr.TraceID, err)
		}

		slog.Error("GetUserIDFromSessionID: session not found", "sessionID", sessionID, "err", err)
		return "", fmt.Errorf("failed to get session: %w", err)
	}

	if sess == nil || sess.UserID == "" {
		slog.Error("GetUserIDFromSessionID: empty user ID", "sessionID", sessionID)
		return "", fmt.Errorf("user_id not found in session")
	}

	slog.Debug("GetUserIDFromSessionID: success", "userID", sess.UserID)
	return sess.UserID, nil
}
