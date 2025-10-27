package auth

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
)

type Handler struct {
	service   *Service
	validator *validator.Validate
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service:   service,
		validator: validator.New(),
	}
}

// RegisterRoutes registers all auth routes
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", h.Register)
		r.Get("/user/{userID}", h.GetUser)
		r.Post("/login", h.RecordLogin)
		r.Patch("/user/{userID}/role", h.RequireAdmin(h.UpdateUserRole))
	})
}

// Register handles user registration
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest

	// Decode request body
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("register error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("register error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	// Register user
	err = h.service.RegisterUser(req.ClerkID, req.Email, req.OrganizationName)
	if err != nil {
		slog.Error("register error", "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"clerkID": req.ClerkID,
	})
}

// GetUser retrieves user information
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")

	if userID == "" {
		http.Error(w, "userID is required", http.StatusBadRequest)
		return
	}

	user, err := h.service.GetUser(userID)
	if err != nil {
		slog.Error("get user error", "err", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// RecordLogin records a user login
func (h *Handler) RecordLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("record login error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get the actual user ID from the Clerk session ID
	userID, err := GetUserIDFromSessionID(req.SessionID)
	if err != nil {
		slog.Error("record login error", "err", err)
		http.Error(w, "Failed to retrieve user from session", http.StatusUnauthorized)
		return
	}

	err = h.service.RecordLogin(userID)
	if err != nil {
		slog.Error("record login error", "err", err)
		http.Error(w, "Failed to record login", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// UpdateUserRole updates a user's role (admin only)
func (h *Handler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")

	if userID == "" {
		http.Error(w, "userID is required", http.StatusBadRequest)
		return
	}

	var req UpdateRoleRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("update role error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("update role error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	err = h.service.UpdateUserRole(userID, req.Role)
	if err != nil {
		slog.Error("update role error", "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// RequireAdmin is middleware that checks if the user is an admin
func (h *Handler) RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from the header set by JWT middleware
		userID := r.Header.Get("X-Clerk-User-ID")
		if userID == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Check if user is admin
		isAdmin, err := h.service.ValidateUserRole(userID, RoleAdmin)
		if err != nil || !isAdmin {
			slog.Error("admin check failed", "userID", userID, "err", err)
			http.Error(w, "Forbidden: admin access required", http.StatusForbidden)
			return
		}

		// User is admin, call next handler
		next(w, r)
	}
}
