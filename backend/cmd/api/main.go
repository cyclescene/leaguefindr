package main

import (
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
	SupabaseURL       string `env:"SUPABASE_URL,required"`
	SupabaseAnonKey   string `env:"SUPABASE_ANON_KEY,required"`
	SupabaseSecretKey string `env:"SUPABASE_SECRET_KEY,required"`
}

var cfg config
var postgrestClient *postgrest.Client
var postgrestServiceClient *postgrest.Client

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

	// Create PostgREST client with publishable key (for user-facing operations with RLS)
	// Note: JWT token will be added per-request via context in middleware
	postgrestClient = postgrest.NewClient(
		cfg.SupabaseURL+"/rest/v1",
		"public",
		map[string]string{
			"apikey": cfg.SupabaseAnonKey,
		},
	)

	// Create PostgREST service client with secret key (for backend admin operations like registration)
	postgrestServiceClient = postgrest.NewClient(
		cfg.SupabaseURL+"/rest/v1",
		"public",
		map[string]string{
			"apikey": cfg.SupabaseSecretKey,
		},
	)

	slog.Info("PostgREST clients initialized", "url", cfg.SupabaseURL)
}

func main() {
	r := newRouter(postgrestClient, postgrestServiceClient)

	slog.Info("Starting server...", "port", "8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
// Trigger workflow with Artifact Registry permissions
