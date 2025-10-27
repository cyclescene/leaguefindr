package main

import (
	"net/http"
	"os"
	"slices"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/leaguefindr/backend/internal/auth"
)

var allowedDomains = []string{
	"http://localhost:3000",
}

func isAllowedOrigin(db *http.Request, origin string) bool {
	return slices.Contains(allowedDomains, origin)
}

func newRouter(dbPool *pgxpool.Pool) *chi.Mux {
	r := chi.NewRouter()

	var corsOptions cors.Options

	if os.Getenv("ENV") == "dev" {
		corsOptions = cors.Options{
			AllowedOrigins:   []string{"*"},
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300, // Maximum value not ignored by any of major browsers
		}
	} else {
		corsOptions = cors.Options{
			AllowOriginFunc:  isAllowedOrigin,
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300, // Maximum value not ignored by any of major browsers
		}
	}

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(corsOptions))

	r.Get("/", health)

	authRepo := auth.NewRepository(dbPool)
	authService := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authService)

	r.Route("/v1", func(r chi.Router) {
		authHandler.RegisterRoutes(r)
	})

	return r
}

func health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
