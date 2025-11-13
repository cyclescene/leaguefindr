package leagues

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

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

// RegisterRoutes registers all league routes
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/leagues", func(r chi.Router) {
		// Public routes (no auth required)
		r.Get("/", h.GetApprovedLeagues)
		r.Get("/{id}", h.GetLeagueByID)

		// Protected routes (JWT required)
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware)
			r.Post("/", h.CreateLeague)
			r.Get("/org/{orgId}", h.GetLeaguesByOrgID)

			// Draft routes
			r.Get("/drafts/org/{orgId}", h.GetDraft)
			r.Post("/drafts", h.SaveDraft)
			r.Delete("/drafts/org/{orgId}", h.DeleteDraft)
			r.Get("/drafts/{orgId}", h.GetDraftsByOrgID)

			// Template routes
			r.Post("/templates", h.SaveTemplate)
			r.Get("/templates/{orgId}", h.GetTemplatesByOrgID)
			r.Put("/templates/{templateId}", h.UpdateTemplate)
			r.Delete("/templates/{templateId}", h.DeleteTemplate)

			// Admin routes
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireAdmin(h.authService))
				r.Get("/admin/all", h.GetAllLeagues)
				r.Get("/admin/pending", h.GetPendingLeagues)
				r.Get("/admin/{id}", h.GetLeagueByIDAdmin)
				r.Get("/admin/drafts/all", h.GetAllDrafts)
				r.Get("/admin/templates/all", h.GetAllTemplates)
				r.Put("/{id}/approve", h.ApproveLeague)
				r.Put("/{id}/reject", h.RejectLeague)
			})
		})
	})
}

// GetApprovedLeagues returns all approved leagues (public)
func (h *Handler) GetApprovedLeagues(w http.ResponseWriter, r *http.Request) {
	leagues, err := h.service.GetApprovedLeagues()
	if err != nil {
		slog.Error("get approved leagues error", "err", err)
		http.Error(w, "Failed to fetch leagues", http.StatusInternalServerError)
		return
	}

	if leagues == nil {
		leagues = []League{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetLeaguesResponse{Leagues: leagues})
}

// GetLeagueByID returns a specific approved league by ID (public)
func (h *Handler) GetLeagueByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "league ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid league ID", http.StatusBadRequest)
		return
	}

	league, err := h.service.GetLeagueByID(id)
	if err != nil {
		slog.Error("get league by id error", "id", id, "err", err)
		http.Error(w, "League not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(league)
}

// GetLeagueByIDAdmin returns a league by ID (admin only - allows viewing any status)
func (h *Handler) GetLeagueByIDAdmin(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "league ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid league ID", http.StatusBadRequest)
		return
	}

	league, err := h.service.GetAllLeagueByID(id)
	if err != nil {
		slog.Error("get league by id admin error", "id", id, "err", err)
		http.Error(w, "League not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(league)
}

// CreateLeague creates a new league submission (authenticated users)
func (h *Handler) CreateLeague(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract org_id from query parameter
	orgID := r.URL.Query().Get("org_id")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	var req CreateLeagueRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("create league error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("create league error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	league, err := h.service.CreateLeague(userID, orgID, &req)
	if err != nil {
		slog.Error("create league error", "userID", userID, "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CreateLeagueResponse{League: *league})
}

// GetLeaguesByOrgID returns leagues for a specific organization
func (h *Handler) GetLeaguesByOrgID(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "orgId")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	leagues, err := h.service.GetLeaguesByOrgID(orgID)
	if err != nil {
		slog.Error("get leagues by org id error", "orgID", orgID, "err", err)
		http.Error(w, "Failed to fetch leagues", http.StatusInternalServerError)
		return
	}

	if leagues == nil {
		leagues = []League{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetLeaguesResponse{Leagues: leagues})
}

// GetAllLeagues returns all leagues regardless of status (admin only)
func (h *Handler) GetAllLeagues(w http.ResponseWriter, r *http.Request) {
	// Parse pagination params from query string
	limit := 20 // default limit
	offset := 0 // default offset

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	leagues, total, err := h.service.GetAllLeaguesWithPagination(limit, offset)
	if err != nil {
		slog.Error("get all leagues error", "err", err)
		http.Error(w, "Failed to fetch leagues", http.StatusInternalServerError)
		return
	}

	if leagues == nil {
		leagues = []League{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"leagues": leagues,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetPendingLeagues returns all pending league submissions (admin only)
func (h *Handler) GetPendingLeagues(w http.ResponseWriter, r *http.Request) {
	// Parse pagination params from query string
	limit := 20 // default limit
	offset := 0 // default offset

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	leagues, total, err := h.service.GetPendingLeaguesWithPagination(limit, offset)
	if err != nil {
		slog.Error("get pending leagues error", "err", err)
		http.Error(w, "Failed to fetch pending leagues", http.StatusInternalServerError)
		return
	}

	if leagues == nil {
		leagues = []League{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"leagues": leagues,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// ApproveLeague approves a pending league submission (admin only)
func (h *Handler) ApproveLeague(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusUnauthorized)
		return
	}

	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "league ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid league ID", http.StatusBadRequest)
		return
	}

	err = h.service.ApproveLeague(userID, id)
	if err != nil {
		slog.Error("approve league error", "id", id, "err", err)
		http.Error(w, "Failed to approve league", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "approved"})
}

// RejectLeague rejects a pending league submission (admin only)
func (h *Handler) RejectLeague(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Missing user ID", http.StatusUnauthorized)
		return
	}

	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "league ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid league ID", http.StatusBadRequest)
		return
	}

	var req RejectLeagueRequest

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("reject league error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("reject league error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	err = h.service.RejectLeague(userID, id, req.RejectionReason)
	if err != nil {
		slog.Error("reject league error", "id", id, "err", err)
		http.Error(w, "Failed to reject league", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "rejected"})
}

// ============= DRAFT HANDLERS =============

// GetDraft returns the draft for an organization
func (h *Handler) GetDraft(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "orgId")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	draft, err := h.service.GetDraft(orgID)
	if err != nil {
		slog.Error("get draft error", "orgID", orgID, "err", err)
		http.Error(w, "Failed to fetch draft", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetLeagueDraftResponse{Draft: draft})
}

// SaveDraft saves or updates a draft for an organization
func (h *Handler) SaveDraft(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get org_id from query parameter (UUID string)
	orgID := r.URL.Query().Get("org_id")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	var req SaveLeagueDraftRequest
	var err error

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("save draft error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("save draft error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	draft, err := h.service.SaveDraft(orgID, userID, req.Name, req.DraftData)
	if err != nil {
		slog.Error("save draft error", "orgID", orgID, "userID", userID, "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetLeagueDraftResponse{Draft: draft})
}

// DeleteDraft deletes a draft for an organization
func (h *Handler) DeleteDraft(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "orgId")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	var req struct {
		DraftID int `json:"draft_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.DraftID == 0 {
		http.Error(w, "draft_id is required", http.StatusBadRequest)
		return
	}

	err := h.service.DeleteDraftByID(req.DraftID, orgID)
	if err != nil {
		slog.Error("delete draft error", "draftID", req.DraftID, "orgID", orgID, "err", err)
		http.Error(w, "Failed to delete draft", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

// GetAllDrafts returns all league drafts across all organizations (admin only)
func (h *Handler) GetAllDrafts(w http.ResponseWriter, r *http.Request) {
	drafts, err := h.service.GetAllDrafts()
	if err != nil {
		slog.Error("get all drafts error", "err", err)
		http.Error(w, "Failed to fetch drafts", http.StatusInternalServerError)
		return
	}

	if drafts == nil {
		drafts = []LeagueDraft{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string][]LeagueDraft{"drafts": drafts})
}

// SaveTemplate saves a league configuration as a reusable template
func (h *Handler) SaveTemplate(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	orgID := r.URL.Query().Get("org_id")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	var req SaveLeagueTemplateRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("save template error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("save template error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	template, err := h.service.SaveTemplate(orgID, userID, req.Name, req.DraftData)
	if err != nil {
		slog.Error("save template error", "orgID", orgID, "userID", userID, "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetLeagueDraftResponse{Draft: template})
}

// GetDraftsByOrgID returns all drafts for an organization
func (h *Handler) GetDraftsByOrgID(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "orgId")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	drafts, err := h.service.GetDraftsByOrgID(orgID)
	if err != nil {
		slog.Error("get drafts by org id error", "orgID", orgID, "err", err)
		http.Error(w, "Failed to fetch drafts", http.StatusInternalServerError)
		return
	}

	if drafts == nil {
		drafts = []LeagueDraft{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string][]LeagueDraft{"drafts": drafts})
}

// GetTemplatesByOrgID returns all templates for an organization
func (h *Handler) GetTemplatesByOrgID(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "orgId")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	templates, err := h.service.GetTemplatesByOrgID(orgID)
	if err != nil {
		slog.Error("get templates by org id error", "orgID", orgID, "err", err)
		http.Error(w, "Failed to fetch templates", http.StatusInternalServerError)
		return
	}

	if templates == nil {
		templates = []LeagueDraft{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string][]LeagueDraft{"templates": templates})
}

// GetAllTemplates returns all templates across all organizations (admin only)
func (h *Handler) GetAllTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := h.service.GetAllTemplates()
	if err != nil {
		slog.Error("get all templates error", "err", err)
		http.Error(w, "Failed to fetch templates", http.StatusInternalServerError)
		return
	}

	if templates == nil {
		templates = []LeagueDraft{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string][]LeagueDraft{"templates": templates})
}

// UpdateTemplate updates an existing template
func (h *Handler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	orgID := r.URL.Query().Get("org_id")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	templateIDStr := chi.URLParam(r, "templateId")
	if templateIDStr == "" {
		http.Error(w, "template ID is required", http.StatusBadRequest)
		return
	}

	templateID, err := strconv.Atoi(templateIDStr)
	if err != nil {
		http.Error(w, "Invalid template ID", http.StatusBadRequest)
		return
	}

	var req SaveLeagueTemplateRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("update template error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("update template error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	template, err := h.service.UpdateTemplate(templateID, orgID, req.Name, req.DraftData)
	if err != nil {
		slog.Error("update template error", "templateID", templateID, "orgID", orgID, "err", err)
		if err.Error() == "template not found or access denied" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetLeagueDraftResponse{Draft: template})
}

// DeleteTemplate deletes a template
func (h *Handler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	orgID := r.URL.Query().Get("org_id")
	if orgID == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	templateIDStr := chi.URLParam(r, "templateId")
	if templateIDStr == "" {
		http.Error(w, "template ID is required", http.StatusBadRequest)
		return
	}

	templateID, err := strconv.Atoi(templateIDStr)
	if err != nil {
		http.Error(w, "Invalid template ID", http.StatusBadRequest)
		return
	}

	err = h.service.DeleteTemplate(templateID, orgID)
	if err != nil {
		slog.Error("delete template error", "templateID", templateID, "orgID", orgID, "err", err)
		if err.Error() == "template not found or access denied" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, "Failed to delete template", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}
