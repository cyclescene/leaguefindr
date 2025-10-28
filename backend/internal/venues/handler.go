package venues

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

// RegisterRoutes registers all venue routes
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/venues", func(r chi.Router) {
		// Public routes (no auth required)
		r.Get("/", h.GetAllApprovedVenues)
		r.Get("/{id}", h.GetVenueByID)

		// Protected routes (JWT required)
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware)
			r.Post("/", h.CreateVenue)

			// Admin routes
			r.Group(func(r chi.Router) {
				r.Use(auth.RequireAdmin(h.authService))
				r.Get("/admin/all", h.GetAllVenues)
				r.Get("/admin/pending", h.GetPendingVenues)
				r.Put("/{id}/approve", h.ApproveVenue)
				r.Put("/{id}/reject", h.RejectVenue)
			})
		})
	})
}

// GetAllApprovedVenues returns all approved venues (public)
func (h *Handler) GetAllApprovedVenues(w http.ResponseWriter, r *http.Request) {
	venues, err := h.service.GetApprovedVenues()
	if err != nil {
		slog.Error("get approved venues error", "err", err)
		http.Error(w, "Failed to fetch venues", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetVenuesResponse{Venues: venues})
}

// GetVenueByID returns a specific approved venue by ID (public)
func (h *Handler) GetVenueByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "venue ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid venue ID", http.StatusBadRequest)
		return
	}

	venue, err := h.service.GetVenueByID(id)
	if err != nil {
		slog.Error("get venue by id error", "id", id, "err", err)
		http.Error(w, "Venue not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(venue)
}

// CreateVenue creates a new venue submission (authenticated users)
func (h *Handler) CreateVenue(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-Clerk-User-ID")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateVenueRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("create venue error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("create venue error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	venue, err := h.service.CreateVenue(userID, &req)
	if err != nil {
		slog.Error("create venue error", "userID", userID, "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CreateVenueResponse{Venue: *venue})
}

// GetAllVenues returns all venues regardless of status (admin only)
func (h *Handler) GetAllVenues(w http.ResponseWriter, r *http.Request) {
	venues, err := h.service.GetAllVenues()
	if err != nil {
		slog.Error("get all venues error", "err", err)
		http.Error(w, "Failed to fetch venues", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetVenuesResponse{Venues: venues})
}

// GetPendingVenues returns all pending venue submissions (admin only)
func (h *Handler) GetPendingVenues(w http.ResponseWriter, r *http.Request) {
	venues, err := h.service.GetPendingVenues()
	if err != nil {
		slog.Error("get pending venues error", "err", err)
		http.Error(w, "Failed to fetch pending venues", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetVenuesResponse{Venues: venues})
}

// ApproveVenue approves a pending venue submission (admin only)
func (h *Handler) ApproveVenue(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "venue ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid venue ID", http.StatusBadRequest)
		return
	}

	err = h.service.ApproveVenue(id)
	if err != nil {
		slog.Error("approve venue error", "id", id, "err", err)
		http.Error(w, "Failed to approve venue", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "approved"})
}

// RejectVenue rejects a pending venue submission (admin only)
func (h *Handler) RejectVenue(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		http.Error(w, "venue ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid venue ID", http.StatusBadRequest)
		return
	}

	var req RejectVenueRequest

	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		slog.Error("reject venue error", "err", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	err = h.validator.Struct(req)
	if err != nil {
		validationErrors := err.(validator.ValidationErrors)
		slog.Error("reject venue error", "err", err)
		http.Error(w, "Validation failed: "+validationErrors.Error(), http.StatusBadRequest)
		return
	}

	err = h.service.RejectVenue(id, &req)
	if err != nil {
		slog.Error("reject venue error", "id", id, "err", err)
		http.Error(w, "Failed to reject venue", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "rejected"})
}
