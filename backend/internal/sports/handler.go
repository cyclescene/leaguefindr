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
	service   *Service
	validator *validator.Validate
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service:   service,
		validator: validator.New(),
	}
}

// RegisterRoutes registers all sports routes
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/sports", func(r chi.Router) {
		// Public routes (no auth required)
		r.Get("/", h.GetAllSports)
		r.Get("/exists", h.CheckSportExists) // Must come before /{id} to avoid being matched as an ID
		r.Get("/{id}", h.GetSportByID)

		// Protected routes (JWT required)
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware)
			r.Post("/", h.CreateSport)
		})
	})
}

// GetAllSports returns all sports (public)
func (h *Handler) GetAllSports(w http.ResponseWriter, r *http.Request) {
	sports, err := h.service.GetAllSports()
	if err != nil {
		slog.Error("get all sports error", "err", err)
		http.Error(w, "Failed to fetch sports", http.StatusInternalServerError)
		return
	}

	if sports == nil {
		sports = []Sport{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GetSportsResponse{Sports: sports})
}

// GetSportByID returns a specific sport by ID (public)
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

// CreateSport creates a new sport (auto-creates if doesn't exist)
func (h *Handler) CreateSport(w http.ResponseWriter, r *http.Request) {
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

	sport, err := h.service.CreateSport(&req)
	if err != nil {
		slog.Error("create sport error", "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CreateSportResponse{Sport: *sport})
}

// CheckSportExists checks if a sport exists by name
func (h *Handler) CheckSportExists(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "name query parameter is required", http.StatusBadRequest)
		return
	}

	sport, err := h.service.CheckSportExists(name)
	if err != nil {
		slog.Error("check sport exists error", "name", name, "err", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := CheckSportExistsResponse{
		Exists: sport != nil,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
