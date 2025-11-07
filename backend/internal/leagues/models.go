package leagues

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

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

// League represents a league in the system
type League struct {
	ID                   int             `json:"id"`
	OrgID                *string         `json:"org_id"` // UUID of the organization
	SportID              int             `json:"sport_id"`
	LeagueName           *string         `json:"league_name"`
	Division             *string         `json:"division"`
	RegistrationDeadline *time.Time      `json:"registration_deadline"`
	SeasonStartDate      *time.Time      `json:"season_start_date"`
	SeasonEndDate        *time.Time      `json:"season_end_date"`
	GameOccurrences      GameOccurrences `json:"game_occurrences"`
	PricingStrategy      PricingStrategy `json:"pricing_strategy"`
	PricingAmount        *float64        `json:"pricing_amount"`
	PricingPerPlayer     *float64        `json:"pricing_per_player"`
	VenueID              *int            `json:"venue_id"`
	AgeGroup             *string         `json:"age_group"`
	Gender               *string         `json:"gender"`
	SeasonDetails        *string         `json:"season_details"`
	RegistrationURL      *string         `json:"registration_url"`
	Duration             *int            `json:"duration"`
	MinimumTeamPlayers   *int            `json:"minimum_team_players"`
	PerGameFee           *float64        `json:"per_game_fee"`
	Status               LeagueStatus    `json:"status"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
	CreatedBy            *string         `json:"created_by"` // UUID of the user who submitted it
	RejectionReason      *string         `json:"rejection_reason"` // Reason for rejection if applicable
}

// CreateLeagueRequest represents the request to create/submit a new league
type CreateLeagueRequest struct {
	OrgID                *string         `json:"org_id" validate:"required"` // UUID of the organization
	SportID              int             `json:"sport_id" validate:"required"`
	LeagueName           *string         `json:"league_name" validate:"max=255"`
	Division             *string         `json:"division" validate:"required,max=255"`
	RegistrationDeadline *string         `json:"registration_deadline" validate:"required"` // ISO 8601 date string
	SeasonStartDate      *string         `json:"season_start_date" validate:"required"` // ISO 8601 date string
	SeasonEndDate        *string         `json:"season_end_date"` // ISO 8601 date string
	GameOccurrences      GameOccurrences `json:"game_occurrences" validate:"required"`
	PricingStrategy      PricingStrategy `json:"pricing_strategy" validate:"required"`
	PricingAmount        *float64        `json:"pricing_amount" validate:"required"`
	VenueID              *int            `json:"venue_id"`
	AgeGroup             *string         `json:"age_group" validate:"required,max=255"`
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
}

// LeagueDraft represents a draft league submission
type LeagueDraft struct {
	ID        int       `json:"id"`
	OrgID     string    `json:"org_id"` // UUID of the organization
	DraftData DraftData `json:"draft_data"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	CreatedBy *string   `json:"created_by"`
}

// DraftData represents the actual draft data stored as JSONB
type DraftData map[string]interface{}

// Scan implements sql.Scanner for DraftData
func (d *DraftData) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, &d)
}

// Value implements driver.Valuer for DraftData
func (d DraftData) Value() (driver.Value, error) {
	return json.Marshal(d)
}

// SaveLeagueDraftRequest represents the request to save a draft
type SaveLeagueDraftRequest struct {
	DraftData DraftData `json:"draft_data" validate:"required"`
}

// GetLeagueDraftResponse represents the response when getting a draft
type GetLeagueDraftResponse struct {
	Draft *LeagueDraft `json:"draft"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}
