package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"
)

// JWTMiddleware validates Clerk JWT tokens from the Authorization header
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		token := parts[1]

		// Verify token with Clerk API
		claims, err := verifyClerkToken(token)
		if err != nil {
			errorMsg := "Invalid token: " + err.Error()
			slog.Error("JWT verification failed", "error", err.Error())
			http.Error(w, errorMsg, http.StatusUnauthorized)
			return
		}

		// Store claims in request context for downstream handlers
		r.Header.Set("X-Clerk-User-ID", claims.Sub)

		next.ServeHTTP(w, r)
	})
}

// ClerkClaims represents the JWT claims from Clerk
type ClerkClaims struct {
	Sub string `json:"sub"`
	// Add other fields as needed (email, etc.)
}

// verifyClerkToken verifies the JWT token by calling Clerk's API
func verifyClerkToken(token string) (*ClerkClaims, error) {
	// Get Clerk API key from environment
	clerkAPIKey := os.Getenv("CLERK_SECRET_KEY")
	if clerkAPIKey == "" {
		return nil, fmt.Errorf("CLERK_SECRET_KEY not set")
	}

	// Call Clerk's verify token endpoint
	// https://clerk.com/docs/reference/backend-api/tag/JWT-Templates#operation/verifyToken
	req, err := http.NewRequest(
		"POST",
		"https://api.clerk.com/v1/verify",
		strings.NewReader(fmt.Sprintf(`{"token":"%s"}`, token)),
	)
	if err != nil {
		slog.Error("verifyClerkToken", "err", err)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add Clerk API key authentication
	req.Header.Set("Authorization", "Bearer "+clerkAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		slog.Error("verifyClerkToken", "err", err)
		return nil, fmt.Errorf("failed to verify token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		slog.Error("verifyClerkToken", "status", resp.StatusCode, "body", string(body))
		return nil, fmt.Errorf("verification failed (status %d): %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		slog.Error("verifyClerkToken", "err", err)
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var claims ClerkClaims
	err = json.Unmarshal(body, &claims)
	if err != nil {
		slog.Error("verifyClerkToken", "err", err)
		return nil, fmt.Errorf("failed to parse claims: %w", err)
	}

	return &claims, nil
}

// GetUserIDFromSessionID retrieves the Clerk user ID from a session ID
func GetUserIDFromSessionID(sessionID string) (string, error) {
	clerkAPIKey := os.Getenv("CLERK_SECRET_KEY")
	if clerkAPIKey == "" {
		return "", fmt.Errorf("CLERK_SECRET_KEY not set")
	}

	clerkPublishableKey := os.Getenv("CLERK_PUBLISHABLE_KEY")
	if clerkPublishableKey == "" {
		return "", fmt.Errorf("CLERK_PUBLISHABLE_KEY not set")
	}

	slog.Debug("GetUserIDFromSessionID", "sessionID", sessionID, "clerkPublishableKey", clerkPublishableKey)

	// Call Clerk's get session endpoint to retrieve session details
	// https://clerk.com/docs/reference/backend-api/tag/Sessions#operation/getSession
	url := fmt.Sprintf("https://api.clerk.com/v1/sessions/%s?client_id=%s", sessionID, clerkPublishableKey)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		slog.Error("GetUserIDFromSessionID", "err", err)
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+clerkAPIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		slog.Error("GetUserIDFromSessionID", "err", err)
		return "", fmt.Errorf("failed to get session: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		slog.Error("GetUserIDFromSessionID", "err", err)
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	slog.Debug("GetUserIDFromSessionID response", "status", resp.StatusCode, "body", string(body))

	if resp.StatusCode != http.StatusOK {
		slog.Error("GetUserIDFromSessionID", "status", resp.StatusCode, "body", string(body))
		return "", fmt.Errorf("session not found (status %d)", resp.StatusCode)
	}

	// Parse the session response to extract user_id
	// Clerk returns the session object directly
	var sessionData struct {
		UserID string `json:"user_id"`
	}
	err = json.Unmarshal(body, &sessionData)
	if err != nil {
		slog.Error("GetUserIDFromSessionID parse error", "body", string(body), "err", err)
		return "", fmt.Errorf("failed to parse session data: %w", err)
	}

	if sessionData.UserID == "" {
		slog.Error("GetUserIDFromSessionID", "err", "user_id is empty", "body", string(body))
		return "", fmt.Errorf("user_id not found in session")
	}

	slog.Debug("GetUserIDFromSessionID success", "userID", sessionData.UserID)
	return sessionData.UserID, nil
}
