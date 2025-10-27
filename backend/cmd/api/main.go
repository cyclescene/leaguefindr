package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"

	"github.com/caarlos0/env/v10"
	clerk "github.com/clerk/clerk-sdk-go/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type config struct {
	DatabaseURL string `env:"DATABASE_URL,required"`
}

var cfg config
var dbPool *pgxpool.Pool

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

	// Create a new pgx connection pool
	dbPool, err = pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		slog.Error("dbPool", "err", err)
		panic(err)
	}

	// Test the connection
	err = dbPool.Ping(context.Background())
	if err != nil {
		slog.Error("dbPool ping", "err", err)
		panic(err)
	}

	slog.Info("Database connection established")
}

func main() {
	defer dbPool.Close()

	r := newRouter(dbPool)

	slog.Info("Starting server...", "port", "8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
