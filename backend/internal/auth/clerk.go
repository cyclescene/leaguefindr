package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/emailaddress"
	"github.com/clerk/clerk-sdk-go/v2/user"
)

// SyncUserMetadataToClerk syncs the user's role to Clerk's public metadata
// Organization information is managed separately and not stored in user metadata
// using the Clerk SDK instead of HTTP calls
func SyncUserMetadataToClerk(userID string, role Role) error {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Prepare metadata (only role - no organization data)
	publicMetadata := map[string]any{
		"role": role.String(),
	}

	// Marshal to JSON RawMessage for SDK
	metadataJSON, err := json.Marshal(publicMetadata)
	if err != nil {
		slog.Error("SyncUserMetadataToClerk marshal error", "err", err)
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	rawMessage := json.RawMessage(metadataJSON)

	// Update user with SDK
	updatedUser, err := user.UpdateMetadata(ctx, userID, &user.UpdateMetadataParams{
		PublicMetadata: &rawMessage,
	})
	if err != nil {
		// Check if it's an API error for better error handling
		if apiErr, ok := err.(*clerk.APIErrorResponse); ok {
			slog.Error("SyncUserMetadataToClerk API error",
				"userID", userID,
				"statusCode", apiErr.HTTPStatusCode,
				"traceID", apiErr.TraceID,
				"err", err)
			return fmt.Errorf("clerk API error (trace: %s): %w", apiErr.TraceID, err)
		}

		slog.Error("SyncUserMetadataToClerk error", "userID", userID, "err", err)
		return fmt.Errorf("failed to sync user metadata to Clerk: %w", err)
	}

	slog.Debug("SyncUserMetadataToClerk success",
		"userID", userID,
		"role", role,
		"updatedUser", updatedUser.ID)

	return nil
}

// VerifyUserEmailInClerk marks a user's primary email as verified in Clerk
// This is used to auto-verify the first admin user so they don't need to verify their email
func VerifyUserEmailInClerk(userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Get the user to find their primary email address ID
	usr, err := user.Get(ctx, userID)
	if err != nil {
		if apiErr, ok := err.(*clerk.APIErrorResponse); ok {
			slog.Error("VerifyUserEmailInClerk: failed to get user",
				"userID", userID,
				"statusCode", apiErr.HTTPStatusCode,
				"traceID", apiErr.TraceID,
				"err", err)
			return fmt.Errorf("failed to get user (trace: %s): %w", apiErr.TraceID, err)
		}

		slog.Error("VerifyUserEmailInClerk: failed to get user", "userID", userID, "err", err)
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Find primary email address ID
	if usr.PrimaryEmailAddressID == nil || *usr.PrimaryEmailAddressID == "" {
		slog.Error("VerifyUserEmailInClerk: no primary email found", "userID", userID)
		return fmt.Errorf("no primary email found for user")
	}

	primaryEmailID := *usr.PrimaryEmailAddressID

	// Verify the email address using the SDK
	verifiedEmail, err := emailaddress.Update(ctx, primaryEmailID, &emailaddress.UpdateParams{
		Verified: clerk.Bool(true),
	})
	if err != nil {
		if apiErr, ok := err.(*clerk.APIErrorResponse); ok {
			slog.Error("VerifyUserEmailInClerk: failed to verify email",
				"userID", userID,
				"emailID", primaryEmailID,
				"statusCode", apiErr.HTTPStatusCode,
				"traceID", apiErr.TraceID,
				"err", err)
			return fmt.Errorf("failed to verify email (trace: %s): %w", apiErr.TraceID, err)
		}

		slog.Error("VerifyUserEmailInClerk: failed to verify email", "userID", userID, "err", err)
		return fmt.Errorf("failed to verify email: %w", err)
	}

	slog.Info("VerifyUserEmailInClerk: auto-verified admin email",
		"userID", userID,
		"email", verifiedEmail.EmailAddress)

	return nil
}
