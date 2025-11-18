package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"

	"github.com/caarlos0/env/v10"
	clerk "github.com/clerk/clerk-sdk-go/v2"
	"github.com/joho/godotenv"
	"github.com/supabase-community/postgrest-go"
)

type config struct {
	SupabaseURL     string `env:"SUPABASE_URL,required"`
	SupabaseAnonKey string `env:"SUPABASE_ANON_KEY,required"`
}

var cfg config
var postgrestClient *postgrest.Client

func init() {
	var err error

	// Set up logging
	slog.SetDefault(slog.New(
		slog.NewTextHandler(
			os.Stdout, &slog.HandlerOptions{
				Level:     slog.LevelDebug,
				AddSource: true,
			})))

	// Load environment variables
	err = godotenv.Load("/home/jd/personal/leaguefindr/backend/.env")
	if err != nil {
		slog.Error("godotenv load error", "err", err)
		// Continue anyway - env vars might be set in the shell
	}

	// Initialize Clerk SDK
	clerkSecretKey := os.Getenv("CLERK_SECRET_KEY")
	if clerkSecretKey == "" {
		slog.Error("CLERK_SECRET_KEY not set")
		panic("CLERK_SECRET_KEY environment variable is required")
	}
	clerk.SetKey(clerkSecretKey)

	// Parse environment variables
	err = env.Parse(&cfg)
	if err != nil {
		slog.Error("config", "err", err)
		panic(err)
	}

	// Create PostgREST client
	// Note: JWT token will be added per-request via context in middleware
	postgrestClient, err = postgrest.NewClient(
		cfg.SupabaseURL+"/rest/v1",
		&postgrest.ClientOptions{
			Headers: map[string]string{
				"apikey": cfg.SupabaseAnonKey,
			},
		},
	)
	if err != nil {
		slog.Error("postgrest client creation error", "err", err)
		panic(err)
	}

	slog.Info("PostgREST client initialized", "url", cfg.SupabaseURL)
}

func main() {
	r := newRouter(postgrestClient)

	slog.Info("Starting server...", "port", "8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
