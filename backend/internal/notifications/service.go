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

	"github.com/jackc/pgx/v5/pgxpool"
)

// Service handles notification operations and real-time broadcasting
type Service struct {
	db                   *pgxpool.Pool
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
func NewService(db *pgxpool.Pool) *Service {
	broadcastURL := os.Getenv("SUPABASE_BROADCAST_URL")
	apiKey := os.Getenv("SUPABASE_API_KEY")

	if broadcastURL == "" {
		slog.Warn("SUPABASE_BROADCAST_URL not configured, realtime broadcasts will be disabled")
	}
	if apiKey == "" {
		slog.Warn("SUPABASE_API_KEY not configured, realtime broadcasts will be disabled")
	}

	return &Service{
		db:                   db,
		supabaseBroadcastURL: broadcastURL,
		supabaseAPIKey:       apiKey,
		httpClient:           &http.Client{Timeout: 5 * time.Second},
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
	var notificationID int
	query := `
		INSERT INTO notifications (user_id, type, title, message, related_league_id, related_org_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, created_at, updated_at
	`

	var createdAt, updatedAt time.Time
	err = s.db.QueryRow(ctx, query, userID, notificationType, title, message, relatedLeagueID, relatedOrgID).
		Scan(&notificationID, &createdAt, &updatedAt)
	if err != nil {
		slog.Error("failed to create notification in database", "userID", userID, "type", notificationType, "err", err)
		return fmt.Errorf("failed to create notification: %w", err)
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

	query := fmt.Sprintf(`
		SELECT %s FROM notification_preferences
		WHERE user_id = $1
	`, preferenceColumn)

	var isEnabled bool
	err := s.db.QueryRow(ctx, query, userID).Scan(&isEnabled)
	if err != nil {
		slog.Warn("failed to fetch notification preference", "userID", userID, "type", notificationType, "err", err)
		return true, nil // Default to true if preference doesn't exist
	}

	return isEnabled, nil
}

// GetNotifications retrieves notifications for a user (with optional pagination)
func (s *Service) GetNotifications(ctx context.Context, userID string, limit int, offset int) ([]NotificationPayload, error) {
	query := `
		SELECT id, user_id, type, title, message, read, related_league_id, related_org_id, created_at, updated_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query notifications: %w", err)
	}
	defer rows.Close()

	var notifications []NotificationPayload
	for rows.Next() {
		var n NotificationPayload
		err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Message, &n.Read,
			&n.RelatedLeagueID, &n.RelatedOrgID, &n.CreatedAt, &n.UpdatedAt)
		if err != nil {
			slog.Error("failed to scan notification", "err", err)
			continue
		}
		notifications = append(notifications, n)
	}

	return notifications, nil
}

// MarkAsRead marks a notification as read
func (s *Service) MarkAsRead(ctx context.Context, notificationID int, userID string) error {
	query := `
		UPDATE notifications
		SET read = true, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND user_id = $2
	`

	result, err := s.db.Exec(ctx, query, notificationID, userID)
	if err != nil {
		return fmt.Errorf("failed to update notification: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("notification not found or unauthorized")
	}

	return nil
}
