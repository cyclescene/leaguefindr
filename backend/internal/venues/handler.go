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
	service   *Service
	validator *validator.Validate
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service:   service,
		validator: validator.New(),
	}
}

// RegisterRoutes registers all venue routes
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/venues", func(r chi.Router) {
		// Public routes (no auth required)
		r.Get("/", h.GetAllVenues)
		r.Get("/exists", h.CheckVenueExists) // Must come before /{id} to avoid being matched as an ID
		r.Get("/{id}", h.GetVenueByID)

		// Protected routes (JWT required)
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware)
			r.Post("/", h.CreateVenue)
		})
	})
}

// GetAllVenues returns all venues (public)
func (h *Handler) GetAllVenues(w http.ResponseWriter, r *http.Request) {
	venues, err := h.service.GetAllVenues(r.Context())
	if err != nil {
		slog.Error("get all venues error", "err", err)
		http.Error(w, "Failed to fetch venues", http.StatusInternalServerError)
		return
	}

	if venues == nil {
		venues = []Venue{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetVenuesResponse{Venues: venues})
}

// GetVenueByID returns a specific venue by ID (public)
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

	venue, err := h.service.GetVenueByID(r.Context(), id)
	if err != nil {
		slog.Error("get venue by id error", "id", id, "err", err)
		http.Error(w, "Venue not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(venue)
}

// CreateVenue creates a new venue (auto-creates if doesn't exist)
func (h *Handler) CreateVenue(w http.ResponseWriter, r *http.Request) {
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

	venue, err := h.service.CreateVenue(r.Context(), &req)
	if err != nil {
		slog.Error("create venue error", "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CreateVenueResponse{Venue: *venue})
}

// CheckVenueExists checks if a venue exists by address
func (h *Handler) CheckVenueExists(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		http.Error(w, "address query parameter is required", http.StatusBadRequest)
		return
	}

	venue, err := h.service.CheckVenueExists(r.Context(), address)
	if err != nil {
		slog.Error("check venue exists error", "address", address, "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := CheckVenueExistsResponse{
		Exists: venue != nil,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
