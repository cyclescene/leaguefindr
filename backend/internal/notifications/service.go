package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/supabase-community/postgrest-go"
)

// Service handles notification operations and real-time broadcasting
type Service struct {
	postgrestClient      *postgrest.Client
	postgrestServiceClient *postgrest.Client // For backend operations (bypasses RLS)
	supabaseBroadcastURL string
	supabaseAPIKey       string
	httpClient           *http.Client
}

// NotificationPayload represents the notification message sent via Realtime
type NotificationPayload struct {
	ID              int       `json:"id"`
	UserID          string    `json:"user_id"`
	Type            string    `json:"type"` // 'league_approved', 'league_rejected', 'league_submitted', 'draft_saved', 'template_saved'
	Title           string    `json:"title"`
	Message         string    `json:"message"`
	Read            bool      `json:"read"`
	RelatedLeagueID *int      `json:"related_league_id,omitempty"`
	RelatedOrgID    *string   `json:"related_org_id,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// broadcastMessage represents the HTTP request body for Supabase Realtime broadcast
type broadcastMessage struct {
	Messages []broadcastPayload `json:"messages"`
}

type broadcastPayload struct {
	Topic   string          `json:"topic"`
	Event   string          `json:"event"`
	Payload json.RawMessage `json:"payload"`
}

// NewService creates a new notification service
func NewService(postgrestClient *postgrest.Client, postgrestServiceClient *postgrest.Client) *Service {
	broadcastURL := os.Getenv("SUPABASE_BROADCAST_URL")
	apiKey := os.Getenv("SUPABASE_API_KEY")

	if broadcastURL == "" {
		slog.Warn("SUPABASE_BROADCAST_URL not configured, realtime broadcasts will be disabled")
	}
	if apiKey == "" {
		slog.Warn("SUPABASE_API_KEY not configured, realtime broadcasts will be disabled")
	}

	return &Service{
		postgrestClient:        postgrestClient,
		postgrestServiceClient: postgrestServiceClient,
		supabaseBroadcastURL:   broadcastURL,
		supabaseAPIKey:         apiKey,
		httpClient:             &http.Client{Timeout: 5 * time.Second},
	}
}

// CreateNotification creates a notification record and broadcasts it via Realtime
// It also checks user notification preferences before broadcasting
func (s *Service) CreateNotification(ctx context.Context, userID string, notificationType string, title string, message string, relatedLeagueID *int, relatedOrgID *string) error {
	// Check if user has this notification type enabled in preferences
	hasPreference, err := s.CheckNotificationPreference(ctx, userID, notificationType)
	if err != nil {
		slog.Warn("failed to check notification preference", "userID", userID, "type", notificationType, "err", err)
		// Continue anyway - don't block notification if preference check fails
	}

	// If preference is disabled, skip notification entirely
	if !hasPreference {
		slog.Info("notification skipped due to user preference", "userID", userID, "type", notificationType)
		return nil
	}

	// Create notification in database
	insertData := map[string]interface{}{
		"user_id":            userID,
		"type":               notificationType,
		"title":              title,
		"message":            message,
		"related_league_id":  relatedLeagueID,
		"related_org_id":     relatedOrgID,
	}

	var results []map[string]interface{}
	_, err = s.postgrestServiceClient.From("notifications").
		Insert(insertData, true, "", "", "").
		ExecuteToWithContext(ctx, &results)

	if err != nil {
		slog.Error("failed to create notification in database", "userID", userID, "type", notificationType, "err", err)
		return fmt.Errorf("failed to create notification: %w", err)
	}

	if len(results) == 0 {
		return fmt.Errorf("failed to create notification: no result returned")
	}

	var notificationID int
	var createdAt, updatedAt time.Time

	if id, ok := results[0]["id"].(float64); ok {
		notificationID = int(id)
	}
	if created, ok := results[0]["created_at"].(string); ok {
		// Parse timestamp - try multiple formats
		if t, err := time.Parse(time.RFC3339Nano, created); err == nil {
			createdAt = t
		} else if t, err := time.Parse("2006-01-02T15:04:05", created); err == nil {
			createdAt = t
		}
	}
	if updated, ok := results[0]["updated_at"].(string); ok {
		// Parse timestamp - try multiple formats
		if t, err := time.Parse(time.RFC3339Nano, updated); err == nil {
			updatedAt = t
		} else if t, err := time.Parse("2006-01-02T15:04:05", updated); err == nil {
			updatedAt = t
		}
	}

	// Create payload for broadcasting
	payload := NotificationPayload{
		ID:              notificationID,
		UserID:          userID,
		Type:            notificationType,
		Title:           title,
		Message:         message,
		Read:            false,
		RelatedLeagueID: relatedLeagueID,
		RelatedOrgID:    relatedOrgID,
		CreatedAt:       createdAt,
		UpdatedAt:       updatedAt,
	}

	// Broadcast to user's notification channel
	err = s.BroadcastNotification(ctx, userID, payload)
	if err != nil {
		slog.Error("failed to broadcast notification", "userID", userID, "notificationID", notificationID, "err", err)
		// Don't return error - notification was saved to DB, broadcast failure isn't fatal
	}

	return nil
}

// BroadcastNotification publishes a notification to Supabase Realtime via HTTP
// It uses a user-specific channel so only that user receives the notification
func (s *Service) BroadcastNotification(ctx context.Context, userID string, payload NotificationPayload) error {
	if s.supabaseBroadcastURL == "" || s.supabaseAPIKey == "" {
		slog.Warn("SUPABASE_BROADCAST_URL or SUPABASE_API_KEY not configured, skipping broadcast")
		return nil
	}

	// Create a unique channel for this user's notifications
	// Format: notifications:user:{userID}
	topic := fmt.Sprintf("notifications:user:%s", userID)

	// Marshal payload to JSON
	messageData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal notification payload: %w", err)
	}

	// Create the broadcast request body
	broadcastReq := broadcastMessage{
		Messages: []broadcastPayload{
			{
				Topic:   topic,
				Event:   "notification",
				Payload: messageData,
			},
		},
	}

	// Marshal the broadcast request
	reqBody, err := json.Marshal(broadcastReq)
	if err != nil {
		return fmt.Errorf("failed to marshal broadcast request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", s.supabaseBroadcastURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return fmt.Errorf("failed to create http request: %w", err)
	}

	// Set headers
	req.Header.Set("apikey", s.supabaseAPIKey)
	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		slog.Error("failed to broadcast notification", "topic", topic, "err", err)
		return fmt.Errorf("failed to broadcast notification: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		slog.Error("broadcast failed with status", "topic", topic, "status", resp.StatusCode)
		return fmt.Errorf("broadcast failed with status %d", resp.StatusCode)
	}

	slog.Info("notification broadcasted", "userID", userID, "type", payload.Type, "topic", topic)
	return nil
}

// BroadcastToAdmins broadcasts a notification to all admin users
// Used for events like new league submissions
func (s *Service) BroadcastToAdmins(ctx context.Context, payload NotificationPayload) error {
	if s.supabaseBroadcastURL == "" || s.supabaseAPIKey == "" {
		slog.Warn("SUPABASE_BROADCAST_URL or SUPABASE_API_KEY not configured, skipping broadcast")
		return nil
	}

	// Create a channel for admin notifications
	topic := "notifications:admins"

	// Marshal payload to JSON
	messageData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal notification payload: %w", err)
	}

	// Create the broadcast request body
	broadcastReq := broadcastMessage{
		Messages: []broadcastPayload{
			{
				Topic:   topic,
				Event:   "notification",
				Payload: messageData,
			},
		},
	}

	// Marshal the broadcast request
	reqBody, err := json.Marshal(broadcastReq)
	if err != nil {
		return fmt.Errorf("failed to marshal broadcast request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", s.supabaseBroadcastURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return fmt.Errorf("failed to create http request: %w", err)
	}

	// Set headers
	req.Header.Set("apikey", s.supabaseAPIKey)
	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		slog.Error("failed to broadcast admin notification", "topic", topic, "err", err)
		return fmt.Errorf("failed to broadcast admin notification: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		slog.Error("admin broadcast failed with status", "topic", topic, "status", resp.StatusCode)
		return fmt.Errorf("broadcast failed with status %d", resp.StatusCode)
	}

	slog.Info("notification broadcasted to admins", "topic", topic)
	return nil
}

// CheckNotificationPreference checks if a user has a specific notification type enabled
func (s *Service) CheckNotificationPreference(ctx context.Context, userID string, notificationType string) (bool, error) {
	// Map notification types to preference columns
	var preferenceColumn string
	switch notificationType {
	case "league_approved":
		preferenceColumn = "league_approved"
	case "league_rejected":
		preferenceColumn = "league_rejected"
	case "league_submitted":
		preferenceColumn = "league_submitted"
	case "draft_saved":
		preferenceColumn = "draft_saved"
	case "template_saved":
		preferenceColumn = "template_saved"
	default:
		return true, nil // Default to true if unknown type
	}

	var prefs []map[string]interface{}
	_, err := s.postgrestClient.From("notification_preferences").
		Select(preferenceColumn, "", false).
		Eq("user_id", userID).
		ExecuteToWithContext(ctx, &prefs)

	if err != nil || len(prefs) == 0 {
		slog.Warn("failed to fetch notification preference", "userID", userID, "type", notificationType, "err", err)
		return true, nil // Default to true if preference doesn't exist
	}

	// Extract the preference value
	if val, ok := prefs[0][preferenceColumn].(bool); ok {
		return val, nil
	}

	return true, nil // Default to true if can't parse
}

// GetNotifications retrieves notifications for a user (with optional pagination)
func (s *Service) GetNotifications(ctx context.Context, userID string, limit int, offset int) ([]NotificationPayload, int64, error) {
	var notifications []NotificationPayload

	count, err := s.postgrestClient.From("notifications").
		Select("*", "exact", false).
		Eq("user_id", userID).
		Order("created_at", &postgrest.OrderOpts{Ascending: false}).
		Range(offset, offset+limit-1, "").
		ExecuteToWithContext(ctx, &notifications)

	if err != nil {
		return nil, 0, fmt.Errorf("failed to query notifications: %w", err)
	}

	if notifications == nil {
		notifications = []NotificationPayload{}
	}

	return notifications, int64(count), nil
}

// MarkAsRead marks a notification as read
func (s *Service) MarkAsRead(ctx context.Context, notificationID int, userID string) error {
	updateData := map[string]interface{}{
		"read": true,
	}

	var result []map[string]interface{}
	_, err := s.postgrestClient.From("notifications").
		Update(updateData, "", "").
		Eq("id", fmt.Sprintf("%d", notificationID)).
		Eq("user_id", userID).
		ExecuteToWithContext(ctx, &result)

	if err != nil {
		return fmt.Errorf("failed to update notification: %w", err)
	}

	if len(result) == 0 {
		return fmt.Errorf("notification not found or unauthorized")
	}

	return nil
}

// CreateNotificationForAllAdmins sends a notification to all admins
func (s *Service) CreateNotificationForAllAdmins(ctx context.Context, notificationType string, title string, message string, relatedLeagueID *int, relatedOrgID *string) error {
	// Fetch all admin users
	var adminUsers []map[string]interface{}
	_, err := s.postgrestServiceClient.From("users").
		Select("id", "", false).
		Eq("role", "admin").
		ExecuteToWithContext(ctx, &adminUsers)

	if err != nil {
		slog.Error("failed to fetch admin users", "err", err)
		return fmt.Errorf("failed to fetch admin users: %w", err)
	}

	if len(adminUsers) == 0 {
		slog.Warn("no admin users found for notification")
		return nil
	}

	// Create notification for each admin
	for _, adminUser := range adminUsers {
		if adminID, ok := adminUser["id"].(string); ok {
			err := s.CreateNotification(ctx, adminID, notificationType, title, message, relatedLeagueID, relatedOrgID)
			if err != nil {
				slog.Error("failed to create admin notification", "adminID", adminID, "err", err)
				// Continue with other admins even if one fails
			}
		}
	}

	return nil
}
