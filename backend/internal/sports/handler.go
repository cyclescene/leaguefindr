package sports

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
	service      *Service
	authService  *auth.Service
	validator    *validator.Validate
}

func NewHandler(service *Service, authService *auth.Service) *Handler {
	return &Handler{
		service:     service,
		authService: authService,
		validator:   validator.New(),
	}
}

// RegisterRoutes registers all sports routes
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/sports", func(r chi.Router) {
		// Public routes (no auth required)
		r.Get("/", h.GetAllApprovedSports)
		r.Get("/exists", h.CheckSportExists) // Must come before /{id} to avoid being matched as an ID
		r.Get("/{id}", h.GetSportByID)

		// Protected routes (JWT required)
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware)
			r.Post("/", h.CreateSport)

			// Admin routes
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireAdmin(h.authService))
				r.Get("/admin/all", h.GetAllSports)
				r.Get("/admin/pending", h.GetPendingSports)
				r.Put("/{id}/approve", h.ApproveSport)
				r.Put("/{id}/reject", h.RejectSport)
			})
		})
	})
}

// GetAllApprovedSports returns all approved sports (public)
func (h *Handler) GetAllApprovedSports(w http.ResponseWriter, r *http.Request) {
	sports, err := h.service.GetApprovedSports()
	if err != nil {
		slog.Error("get approved sports error", "err", err)
		http.Error(w, "Failed to fetch sports", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetSportsResponse{Sports: sports})
}

// GetSportByID returns a specific approved sport by ID (public)
func (h *Handler) GetSportByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "sport ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid sport ID", http.StatusBadRequest)
		return
	}

	sport, err := h.service.GetSportByID(id)
	if err != nil {
		slog.Error("get sport by id error", "id", id, "err", err)
		http.Error(w, "Sport not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(sport)
}

// CreateSport creates a new sport submission (authenticated users)
func (h *Handler) CreateSport(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateSportRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("create sport error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("create sport error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	sport, err := h.service.CreateSport(userID, &req)
	if err != nil {
		slog.Error("create sport error", "userID", userID, "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CreateSportResponse{Sport: *sport})
}

// GetAllSports returns all sports regardless of status (admin only)
func (h *Handler) GetAllSports(w http.ResponseWriter, r *http.Request) {
	sports, err := h.service.GetAllSports()
	if err != nil {
		slog.Error("get all sports error", "err", err)
		http.Error(w, "Failed to fetch sports", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetSportsResponse{Sports: sports})
}

// GetPendingSports returns all pending sport submissions (admin only)
func (h *Handler) GetPendingSports(w http.ResponseWriter, r *http.Request) {
	sports, err := h.service.GetPendingSports()
	if err != nil {
		slog.Error("get pending sports error", "err", err)
		http.Error(w, "Failed to fetch pending sports", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetSportsResponse{Sports: sports})
}

// ApproveSport approves a pending sport submission (admin only)
func (h *Handler) ApproveSport(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "sport ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid sport ID", http.StatusBadRequest)
		return
	}

	err = h.service.ApproveSport(id)
	if err != nil {
		slog.Error("approve sport error", "id", id, "err", err)
		http.Error(w, "Failed to approve sport", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "approved"})
}

// RejectSport rejects a pending sport submission (admin only)
func (h *Handler) RejectSport(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "sport ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid sport ID", http.StatusBadRequest)
		return
	}

	var req RejectSportRequest

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("reject sport error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("reject sport error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	err = h.service.RejectSport(id, &req)
	if err != nil {
		slog.Error("reject sport error", "id", id, "err", err)
		http.Error(w, "Failed to reject sport", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "rejected"})
}

// CheckSportExists checks if a sport exists by name and returns its status (public)
func (h *Handler) CheckSportExists(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "sport name is required", http.StatusBadRequest)
		return
	}

	sport, err := h.service.CheckSportExists(name)
	if err != nil {
		slog.Error("check sport exists error", "name", name, "err", err)
		http.Error(w, "Failed to check sport", http.StatusInternalServerError)
		return
	}

	response := CheckSportExistsResponse{
		Exists: sport != nil,
	}

	if sport != nil {
		response.Status = sport.Status
		response.RejectionReason = sport.RejectionReason
		response.RequestCount = sport.RequestCount
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
