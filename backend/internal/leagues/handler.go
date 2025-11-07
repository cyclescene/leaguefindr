package leagues

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/leaguefindr/backend/internal/auth"
	"github.com/leaguefindr/backend/internal/organizations"
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

			// Admin routes
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireAdmin(h.authService))
				r.Get("/admin/all", h.GetAllLeagues)
				r.Get("/admin/pending", h.GetPendingLeagues)
				r.Get("/admin/drafts/all", h.GetAllDrafts)
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

// CreateLeague creates a new league submission (authenticated users)
func (h *Handler) CreateLeague(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
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

	league, err := h.service.CreateLeague(userID, &req)
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
	orgIDStr := chi.URLParam(r, "orgId")
	if orgIDStr == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	orgID, err := strconv.Atoi(orgIDStr)
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
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
	leagues, err := h.service.GetAllLeagues()
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
	json.NewEncoder(w).Encode(GetLeaguesResponse{Leagues: leagues})
}

// GetPendingLeagues returns all pending league submissions (admin only)
func (h *Handler) GetPendingLeagues(w http.ResponseWriter, r *http.Request) {
	leagues, err := h.service.GetPendingLeagues()
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
	json.NewEncoder(w).Encode(GetLeaguesResponse{Leagues: leagues})
}

// ApproveLeague approves a pending league submission (admin only)
func (h *Handler) ApproveLeague(w http.ResponseWriter, r *http.Request) {
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

	err = h.service.ApproveLeague(id)
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

	err = h.service.RejectLeague(id, req.RejectionReason)
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
	orgIDStr := chi.URLParam(r, "orgId")
	if orgIDStr == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	orgID, err := strconv.Atoi(orgIDStr)
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
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

	// Get org_id from query parameter or context (adjust based on your auth setup)
	orgIDStr := r.URL.Query().Get("org_id")
	if orgIDStr == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	orgID, err := strconv.Atoi(orgIDStr)
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	var req SaveLeagueDraftRequest

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

	draft, err := h.service.SaveDraft(orgID, userID, req.DraftData)
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
	orgIDStr := chi.URLParam(r, "orgId")
	if orgIDStr == "" {
		http.Error(w, "organization ID is required", http.StatusBadRequest)
		return
	}

	orgID, err := strconv.Atoi(orgIDStr)
	if err != nil {
		http.Error(w, "Invalid organization ID", http.StatusBadRequest)
		return
	}

	err = h.service.DeleteDraft(orgID)
	if err != nil {
		slog.Error("delete draft error", "orgID", orgID, "err", err)
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
