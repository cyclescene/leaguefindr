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
		// Public routes (no auth required)
		r.Post("/register", h.Register)
		r.Post("/login", h.RecordLogin)

		// Protected routes (JWT required)
		r.Group(func(r chi.Router) {
			r.Use(JWTMiddleware)
			r.Get("/user/{userID}", h.GetUser)
			r.Get("/supabase-token", h.GetSupabaseToken)

			// Admin routes
			r.Group(func(r chi.Router) {
				r.Use(RequireAdmin(h.service))
				r.Patch("/user/{userID}/role", h.UpdateUserRole)
			})
		})
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

	// Register user (no organization assignment yet - user will do that during onboarding)
	err = h.service.RegisterUser(req.ClerkID, req.Email)
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
// Requires JWT authentication - users can only fetch their own data
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	authenticatedUserID := r.Header.Get("X-Clerk-User-ID")

	if userID == "" {
		http.Error(w, "userID is required", http.StatusBadRequest)
		return
	}

	// Verify that authenticated user can only access their own data (unless admin)
	isAdmin, err := h.service.ValidateUserRole(authenticatedUserID, RoleAdmin)
	if err != nil || !isAdmin {
		// Non-admin users can only access their own data
		if userID != authenticatedUserID {
			slog.Warn("unauthorized user data access attempt",
				"authenticatedUserID", authenticatedUserID,
				"requestedUserID", userID)
			http.Error(w, "Forbidden: cannot access other users' data", http.StatusForbidden)
			return
		}
	}

	user, err := h.service.GetUser(userID)
	if err != nil {
		slog.Error("get user error", "userID", userID, "err", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// GetSupabaseToken generates a Supabase JWT token for real-time subscriptions
// Requires JWT authentication - returns a token valid for 1 hour
func (h *Handler) GetSupabaseToken(w http.ResponseWriter, r *http.Request) {
	authenticatedUserID := r.Header.Get("X-Clerk-User-ID")

	authHeader := r.Header.Get("Authorization")
	authHeaderPreview := authHeader
	if len(authHeaderPreview) > 20 {
		authHeaderPreview = authHeaderPreview[:20] + "..."
	}

	slog.Info("GetSupabaseToken: processing request",
		"userID", authenticatedUserID,
		"authHeaderPresent", authHeader != "",
		"authHeaderPreview", authHeaderPreview,
	)

	if authenticatedUserID == "" {
		slog.Error("GetSupabaseToken: missing X-Clerk-User-ID header")
		http.Error(w, "User ID not found in token", http.StatusUnauthorized)
		return
	}

	// Generate Supabase token
	supabaseToken, err := GenerateSupabaseToken(authenticatedUserID, h.service)
	if err != nil {
		slog.Error("failed to generate supabase token", "userID", authenticatedUserID, "err", err)
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(SupabaseTokenResponse{
		SupabaseToken: supabaseToken,
		ExpiresIn:     3600, // 1 hour
	})
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
