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

// SyncUserMetadataToClerk syncs the user's role and organization to Clerk's public metadata
func SyncUserMetadataToClerk(userID string, role Role, organizationName string) error {
	clerkAPIKey := os.Getenv("CLERK_SECRET_KEY")
	if clerkAPIKey == "" {
		return fmt.Errorf("CLERK_SECRET_KEY not set")
	}

	// Prepare the request to update user metadata
	updateData := map[string]any{
		"public_metadata": map[string]any{
			"role":             role.String(),
			"organizationName": organizationName,
		},
	}

	body, err := json.Marshal(updateData)
	if err != nil {
		slog.Error("SyncUserMetadataToClerk marshal error", "err", err)
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	// Call Clerk's update user endpoint
	// https://clerk.com/docs/reference/backend-api/tag/Users#operation/updateUser
	url := fmt.Sprintf("https://api.clerk.com/v1/users/%s", userID)
	req, err := http.NewRequest("PATCH", url, strings.NewReader(string(body)))
	if err != nil {
		slog.Error("SyncUserMetadataToClerk request error", "err", err)
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+clerkAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		slog.Error("SyncUserMetadataToClerk request failed", "err", err)
		return fmt.Errorf("failed to sync user metadata to Clerk: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		slog.Error("SyncUserMetadataToClerk failed", "status", resp.StatusCode, "body", string(respBody))
		return fmt.Errorf("sync failed (status %d): %s", resp.StatusCode, string(respBody))
	}

	slog.Debug("SyncUserMetadataToClerk success", "userID", userID, "role", role, "organizationName", organizationName)
	return nil
}
