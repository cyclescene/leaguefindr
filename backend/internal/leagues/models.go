package leagues

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/leaguefindr/backend/internal/shared"
)

// Import shared custom types for backwards compatibility
type Date = shared.Date
type Timestamp = shared.Timestamp

// LeagueStatus represents the approval status of a league
type LeagueStatus string

const (
	LeagueStatusPending  LeagueStatus = "pending"
	LeagueStatusApproved LeagueStatus = "approved"
	LeagueStatusRejected LeagueStatus = "rejected"
)

// IsValid checks if the status is a valid league status
func (l LeagueStatus) IsValid() bool {
	switch l {
	case LeagueStatusPending, LeagueStatusApproved, LeagueStatusRejected:
		return true
	default:
		return false
	}
}

// String returns the string representation of the status
func (l LeagueStatus) String() string {
	return string(l)
}

// PricingStrategy represents the pricing model for a league
type PricingStrategy string

const (
	PricingStrategyPerTeam   PricingStrategy = "per_team"
	PricingStrategyPerPerson PricingStrategy = "per_person"
)

// IsValid checks if the pricing strategy is valid
func (p PricingStrategy) IsValid() bool {
	switch p {
	case PricingStrategyPerTeam, PricingStrategyPerPerson:
		return true
	default:
		return false
	}
}

// String returns the string representation of the pricing strategy
func (p PricingStrategy) String() string {
	return string(p)
}

// GameOccurrence represents a single game occurrence (day and time)
type GameOccurrence struct {
	Day       string `json:"day"`       // e.g., "Monday"
	StartTime string `json:"startTime"` // e.g., "19:00"
	EndTime   string `json:"endTime"`   // e.g., "21:00"
}

// GameOccurrenceRow represents a row in the game_occurrences table
type GameOccurrenceRow struct {
	ID        int       `db:"id"`
	LeagueID  int       `db:"league_id"`
	Day       string    `db:"day"`        // Monday, Tuesday, etc.
	StartTime string    `db:"start_time"` // HH:MM format
	EndTime   string    `db:"end_time"`   // HH:MM format
	CreatedAt time.Time `db:"created_at"`
}

// GameOccurrences is a slice of GameOccurrence that implements sql.Scanner and driver.Valuer
type GameOccurrences []GameOccurrence

// Scan implements sql.Scanner
func (g *GameOccurrences) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, &g)
}

// Value implements driver.Valuer
func (g GameOccurrences) Value() (driver.Value, error) {
	return json.Marshal(g)
}

// SupplementalRequests represents sport and venue data for items that don't exist in the database yet
type SupplementalRequests struct {
	Sport *SupplementalSport `json:"sport,omitempty"`
	Venue *SupplementalVenue `json:"venue,omitempty"`
}

// SupplementalSport represents a sport that needs to be created
type SupplementalSport struct {
	Name string `json:"name"`
}

// SupplementalVenue represents a venue that needs to be created
type SupplementalVenue struct {
	Name    string   `json:"name"`
	Address string   `json:"address"`
	Lat     *float64 `json:"lat"`
	Lng     *float64 `json:"lng"`
}

// League represents a league in the system
type League struct {
	ID                   *string               `json:"id"`                     // UUID of the league
	OrgID                *string               `json:"org_id"`                 // UUID of the organization
	SportID              *int64                `json:"sport_id"`               // Nullable if sport doesn't exist yet
	LeagueName           *string               `json:"league_name"`
	Division             *string               `json:"division"`
	RegistrationDeadline *Date                 `json:"registration_deadline"` // DATE column - uses custom Date type
	SeasonStartDate      *Date                 `json:"season_start_date"`      // DATE column - uses custom Date type
	SeasonEndDate        *Date                 `json:"season_end_date"`        // DATE column - uses custom Date type
	GameOccurrences      GameOccurrences       `json:"game_occurrences"`
	PricingStrategy      PricingStrategy       `json:"pricing_strategy"`
	PricingAmount        *float64              `json:"pricing_amount"`
	PricingPerPlayer     *float64              `json:"pricing_per_player"`
	VenueID              *int64                `json:"venue_id"`               // Nullable if venue doesn't exist yet
	Gender               *string               `json:"gender"`
	SeasonDetails        *string               `json:"season_details"`
	RegistrationURL      *string               `json:"registration_url"`
	Duration             *int                  `json:"duration"`
	MinimumTeamPlayers   *int                  `json:"minimum_team_players"`
	PerGameFee           *float64              `json:"per_game_fee"`
	SupplementalRequests *SupplementalRequests `json:"supplemental_requests"` // Sport/venue data for items not in DB
	FormData             FormData              `json:"form_data"`              // Complete form submission data
	Status               LeagueStatus          `json:"status"`
	CreatedAt            Timestamp             `json:"created_at"`   // TIMESTAMP column - uses custom Timestamp type
	UpdatedAt            Timestamp             `json:"updated_at"`   // TIMESTAMP column - uses custom Timestamp type
	CreatedBy            *string               `json:"created_by"`   // UUID of the user who submitted it
	RejectionReason      *string               `json:"rejection_reason"` // Reason for rejection if applicable
}

// CreateLeagueRequest represents the request to create/submit a new league
type CreateLeagueRequest struct {
	SportID              *int64          `json:"sport_id"` // Optional if sport doesn't exist yet
	SportName            string          `json:"sport_name" validate:"required,max=255"` // Sport name (always required)
	OrganizationName     *string         `json:"organization_name" validate:"max=255"` // Organization name for draft_data
	LeagueName           *string         `json:"league_name" validate:"max=255"`
	Division             *string         `json:"division" validate:"required,max=255"`
	RegistrationDeadline *string         `json:"registration_deadline" validate:"required"` // ISO 8601 date string
	SeasonStartDate      *string         `json:"season_start_date" validate:"required"` // ISO 8601 date string
	SeasonEndDate        *string         `json:"season_end_date"` // ISO 8601 date string
	GameOccurrences      GameOccurrences `json:"game_occurrences" validate:"required"`
	PricingStrategy      PricingStrategy `json:"pricing_strategy" validate:"required"`
	PricingAmount        *float64        `json:"pricing_amount" validate:"required"`
	VenueID              *int64          `json:"venue_id"` // Optional if venue doesn't exist yet
	VenueName            *string         `json:"venue_name" validate:"max=255"` // Optional venue name
	VenueAddress         *string         `json:"venue_address" validate:"max=500"` // Optional venue address
	VenueLat             *float64        `json:"venue_lat"` // Optional venue latitude from Mapbox
	VenueLng             *float64        `json:"venue_lng"` // Optional venue longitude from Mapbox
	Gender               *string         `json:"gender" validate:"required,max=255"`
	SeasonDetails        *string         `json:"season_details" validate:"max=2000"`
	RegistrationURL      *string         `json:"registration_url" validate:"required,max=500"`
	Duration             *int            `json:"duration" validate:"required"`
	MinimumTeamPlayers   *int            `json:"minimum_team_players" validate:"required"`
	PerGameFee           *float64        `json:"per_game_fee"`
}

// ApproveLeagueRequest represents the request to approve a league submission
type ApproveLeagueRequest struct {
	// No body needed, just the ID in the path
}

// RejectLeagueRequest represents the request to reject a league submission
type RejectLeagueRequest struct {
	RejectionReason string `json:"rejection_reason" validate:"required,min=1,max=500"`
}

// CreateLeagueResponse represents the response when creating a league
type CreateLeagueResponse struct {
	League League `json:"league"`
}

// GetLeaguesResponse represents the response when getting multiple leagues
type GetLeaguesResponse struct {
	Leagues []League `json:"leagues"`
	Count   int64    `json:"count"`
}

// DraftType represents the type of draft (draft or template)
type DraftType string

const (
	DraftTypeDraft    DraftType = "draft"
	DraftTypeTemplate DraftType = "template"
)

// LeagueDraft represents a draft league submission or template
type LeagueDraft struct {
	ID        int       `json:"id"`
	OrgID     string    `json:"org_id"` // UUID of the organization
	Type      DraftType `json:"type"`   // "draft" or "template"
	Name      *string   `json:"name"`   // Name for templates, null for drafts
	FormData  FormData  `json:"form_data"`
	CreatedAt Timestamp `json:"created_at"` // TIMESTAMP column - uses custom Timestamp type
	UpdatedAt Timestamp `json:"updated_at"` // TIMESTAMP column - uses custom Timestamp type
	CreatedBy *string   `json:"created_by"`
}

// FormData represents the actual form submission data stored as JSONB
type FormData map[string]interface{}

// Scan implements sql.Scanner for FormData
func (f *FormData) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, &f)
}

// Value implements driver.Valuer for FormData
func (f FormData) Value() (driver.Value, error) {
	return json.Marshal(f)
}

// SaveLeagueDraftRequest represents the request to save a draft
type SaveLeagueDraftRequest struct {
	DraftID  *int     `json:"draft_id"` // Optional draft ID for updating existing draft
	Name     *string  `json:"name" validate:"omitempty,max=255"` // Optional draft name
	FormData FormData `json:"data" validate:"required"`
}

// SaveLeagueTemplateRequest represents the request to save a league as a template
type SaveLeagueTemplateRequest struct {
	Name     string   `json:"name" validate:"required,min=1,max=255"`
	FormData FormData `json:"form_data" validate:"required"`
}

// GetLeagueDraftResponse represents the response when getting a draft
type GetLeagueDraftResponse struct {
	Draft *LeagueDraft `json:"draft"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}
