package main

import (
	"net/http"
	"os"
	"slices"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/supabase-community/postgrest-go"
	"github.com/leaguefindr/backend/internal/auth"
	"github.com/leaguefindr/backend/internal/leagues"
	"github.com/leaguefindr/backend/internal/notifications"
	"github.com/leaguefindr/backend/internal/organizations"
	"github.com/leaguefindr/backend/internal/sports"
	"github.com/leaguefindr/backend/internal/venues"
)

var allowedDomains = []string{
	"http://localhost:3000",
}

func isAllowedOrigin(db *http.Request, origin string) bool {
	return slices.Contains(allowedDomains, origin)
}

func newRouter(postgrestClient *postgrest.Client, postgrestServiceClient *postgrest.Client) *chi.Mux {
	r := chi.NewRouter()

	var corsOptions cors.Options

	if os.Getenv("ENV") == "dev" {
		corsOptions = cors.Options{
			AllowedOrigins:   []string{"*"},
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Clerk-User-ID"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300, // Maximum value not ignored by any of major browsers
		}
	} else {
		corsOptions = cors.Options{
			AllowOriginFunc:  isAllowedOrigin,
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Clerk-User-ID"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300, // Maximum value not ignored by any of major browsers
		}
	}

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(corsOptions))

	r.Get("/", health)

	// Auth
	authService := auth.NewServiceWithConfig(postgrestClient, postgrestServiceClient, cfg.SupabaseURL+"/rest/v1", cfg.SupabaseAnonKey)
	authHandler := auth.NewHandler(authService)

	// Sports
	sportsService := sports.NewService(postgrestClient, cfg.SupabaseURL+"/rest/v1", cfg.SupabaseAnonKey)
	sportsHandler := sports.NewHandler(sportsService)

	// Venues
	venuesService := venues.NewService(postgrestClient, cfg.SupabaseURL+"/rest/v1", cfg.SupabaseAnonKey)
	venuesHandler := venues.NewHandler(venuesService)

	// Organizations
	organizationsService := organizations.NewService(postgrestClient, cfg.SupabaseURL+"/rest/v1", cfg.SupabaseAnonKey)
	organizationsHandler := organizations.NewHandler(organizationsService, authService)

	// Notifications
	notificationsService := notifications.NewService(postgrestClient, postgrestServiceClient)
	notificationsHandler := notifications.NewHandler(notificationsService)

	// Leagues
	leaguesService := leagues.NewService(postgrestClient, cfg.SupabaseURL+"/rest/v1", cfg.SupabaseAnonKey, organizationsService, authService, sportsService, venuesService, notificationsService)
	leaguesHandler := leagues.NewHandler(leaguesService, authService)

	r.Route("/v1", func(r chi.Router) {
		authHandler.RegisterRoutes(r)
		organizationsHandler.RegisterRoutes(r)
		sportsHandler.RegisterRoutes(r)
		venuesHandler.RegisterRoutes(r)
		leaguesHandler.RegisterRoutes(r)
		notificationsHandler.RegisterRoutes(r)

	})

	return r
}

func health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy","version":"v1","message":"League Findr API is running"}`))
}
