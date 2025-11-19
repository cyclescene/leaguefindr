package notifications

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/leaguefindr/backend/internal/auth"
)

// Handler handles notification HTTP requests
type Handler struct {
	service   *Service
	validator *validator.Validate
}

// NewHandler creates a new notification handler
func NewHandler(service *Service) *Handler {
	return &Handler{
		service:   service,
		validator: validator.New(),
	}
}

// RegisterRoutes registers all notification routes
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/notifications", func(r chi.Router) {
		// All routes are protected with JWT
		r.Use(auth.JWTMiddleware)
		r.Get("/", h.GetNotifications)
		r.Patch("/{notificationID}/read", h.MarkAsRead)
	})
}

// GetNotifications retrieves notifications for the authenticated user
// Query parameters: limit (default 20), offset (default 0)
func (h *Handler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	authenticatedUserID := r.Header.Get("X-Clerk-User-ID")
	if authenticatedUserID == "" {
		http.Error(w, "User ID not found in token", http.StatusUnauthorized)
		return
	}

	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 20
	offset := 0

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	if offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	ctx := r.Context()
	notifications, count, err := h.service.GetNotifications(ctx, authenticatedUserID, limit, offset)
	if err != nil {
		slog.Error("failed to get notifications", "userID", authenticatedUserID, "err", err)
		http.Error(w, "Failed to retrieve notifications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"notifications": notifications,
		"count":         count,
		"limit":         limit,
		"offset":        offset,
	})
}

// MarkAsRead marks a notification as read for the authenticated user
func (h *Handler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	authenticatedUserID := r.Header.Get("X-Clerk-User-ID")
	if authenticatedUserID == "" {
		http.Error(w, "User ID not found in token", http.StatusUnauthorized)
		return
	}

	notificationIDStr := chi.URLParam(r, "notificationID")
	if notificationIDStr == "" {
		http.Error(w, "notificationID is required", http.StatusBadRequest)
		return
	}

	notificationID, err := strconv.Atoi(notificationIDStr)
	if err != nil {
		http.Error(w, "Invalid notification ID", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	err = h.service.MarkAsRead(ctx, notificationID, authenticatedUserID)
	if err != nil {
		slog.Error("failed to mark notification as read", "notificationID", notificationID, "userID", authenticatedUserID, "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}
