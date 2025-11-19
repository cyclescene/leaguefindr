package organizations

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/leaguefindr/backend/internal/auth"
)

type Handler struct {
	service     *Service
	authService *auth.Service
	validator   *validator.Validate
}

func NewHandler(service *Service, authService *auth.Service) *Handler {
	return &Handler{
		service:     service,
		authService: authService,
		validator:   validator.New(),
	}
}

// RegisterRoutes registers all organization routes
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/organizations", func(r chi.Router) {
		// Protected routes (JWT required)
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware)

			// Public routes accessible to all authenticated users
			r.Get("/admin", h.GetAllOrganizations)
			r.Get("/user", h.GetUserOrganizations)
			r.Get("/{orgId}", h.GetOrganization)
			r.Post("/", h.CreateOrganization)
			r.Post("/join", h.JoinOrganization)
			r.Put("/{orgId}", h.UpdateOrganization)
			r.Delete("/{orgId}", h.DeleteOrganization)
		})
	})
}

// CreateOrganization creates a new organization
func (h *Handler) CreateOrganization(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusUnauthorized)
		return
	}

	var req CreateOrganizationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		http.Error(w, "Validation failed", http.StatusBadRequest)
		return
	}

	// Dereference optional string pointers
	orgURL := ""
	if req.OrgURL != nil {
		orgURL = *req.OrgURL
	}
	orgEmail := ""
	if req.OrgEmail != nil {
		orgEmail = *req.OrgEmail
	}
	orgPhone := ""
	if req.OrgPhone != nil {
		orgPhone = *req.OrgPhone
	}
	orgAddress := ""
	if req.OrgAddress != nil {
		orgAddress = *req.OrgAddress
	}

	orgID, err := h.service.CreateOrganization(
		r.Context(),
		req.OrgName,
		orgURL,
		orgEmail,
		orgPhone,
		orgAddress,
		userID,
	)
	if err != nil {
		slog.Error("Failed to create organization", "error", err, "userId", userID)
		http.Error(w, "Failed to create organization", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":       orgID,
		"org_name": req.OrgName,
	})
}

// GetUserOrganizations gets all organizations for the current user
func (h *Handler) GetUserOrganizations(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusUnauthorized)
		return
	}

	orgs, err := h.service.GetUserOrganizations(r.Context(), userID)
	if err != nil {
		slog.Error("Failed to get user organizations", "error", err, "userId", userID)
		http.Error(w, "Failed to get organizations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(orgs)
}

// GetOrganization gets a single organization by ID
func (h *Handler) GetOrganization(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusUnauthorized)
		return
	}

	orgID := chi.URLParam(r, "orgId")
	if orgID == "" {
		http.Error(w, "Missing organization ID", http.StatusBadRequest)
		return
	}

	// Verify user has access to this organization
	if err := h.service.VerifyUserOrgAccess(r.Context(), userID, orgID); err != nil {
		slog.Warn("User attempted unauthorized org access", "userId", userID, "orgId", orgID)
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	org, err := h.service.GetOrganizationByID(r.Context(), orgID)
	if err != nil {
		slog.Error("Failed to get organization", "error", err, "orgId", orgID)
		http.Error(w, "Organization not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(org)
}

// JoinOrganization allows a user to join an organization
func (h *Handler) JoinOrganization(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusUnauthorized)
		return
	}

	var req JoinOrganizationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		http.Error(w, "Validation failed", http.StatusBadRequest)
		return
	}

	if err := h.service.JoinOrganization(r.Context(), userID, req.OrgID); err != nil {
		slog.Error("Failed to join organization", "error", err, "userId", userID, "orgId", req.OrgID)
		http.Error(w, "Failed to join organization", http.StatusInternalServerError)
		return
	}

	// Get the organization to return it
	org, err := h.service.GetOrganizationByID(r.Context(), req.OrgID)
	if err != nil {
		slog.Error("Failed to get organization after join", "error", err, "orgId", req.OrgID)
		http.Error(w, "Failed to get organization", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"org_id":   org.ID,
		"org_name": org.OrgName,
	})
}

// GetAllOrganizations gets all organizations (admin only)
func (h *Handler) GetAllOrganizations(w http.ResponseWriter, r *http.Request) {
	orgs, err := h.service.GetAllOrganizations(r.Context())
	if err != nil {
		slog.Error("Failed to get all organizations", "error", err)
		http.Error(w, "Failed to get organizations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(orgs)
}

// UpdateOrganization updates organization details (admin/owner only)
func (h *Handler) UpdateOrganization(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusUnauthorized)
		return
	}

	orgID := chi.URLParam(r, "orgId")
	if orgID == "" {
		http.Error(w, "Missing organization ID", http.StatusBadRequest)
		return
	}

	var req UpdateOrganizationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.validator.Struct(req); err != nil {
		http.Error(w, "Validation failed", http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateOrganization(r.Context(), userID, orgID, req.OrgName, req.OrgURL, req.OrgEmail, req.OrgPhone, req.OrgAddress); err != nil {
		slog.Error("Failed to update organization", "error", err, "userId", userID, "orgId", orgID)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

// DeleteOrganization deletes (soft delete) an organization (owner only)
func (h *Handler) DeleteOrganization(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusUnauthorized)
		return
	}

	orgID := chi.URLParam(r, "orgId")
	if orgID == "" {
		http.Error(w, "Missing organization ID", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteOrganization(r.Context(), userID, orgID); err != nil {
		slog.Error("Failed to delete organization", "error", err, "userId", userID, "orgId", orgID)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}
