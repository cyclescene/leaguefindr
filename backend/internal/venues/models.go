package venues

import "time"

// VenueStatus represents the approval status of a venue
type VenueStatus string

const (
	VenueStatusPending  VenueStatus = "pending"
	VenueStatusApproved VenueStatus = "approved"
	VenueStatusRejected VenueStatus = "rejected"
)

// IsValid checks if the status is a valid venue status
func (v VenueStatus) IsValid() bool {
	switch v {
	case VenueStatusPending, VenueStatusApproved, VenueStatusRejected:
		return true
	default:
		return false
	}
}

// String returns the string representation of the status
func (v VenueStatus) String() string {
	return string(v)
}

// Venue represents a venue/location in the system
type Venue struct {
	ID              int       `json:"id"`
	Name            string    `json:"name"`
	Address         string    `json:"address"`
	Latitude        float64   `json:"latitude"`
	Longitude       float64   `json:"longitude"`
	Status          VenueStatus `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	CreatedBy       *string   `json:"created_by"` // UUID of the user who submitted it
	RejectionReason *string   `json:"rejection_reason"` // Reason for rejection if applicable
}

// CreateVenueRequest represents the request to create/submit a new venue
type CreateVenueRequest struct {
	Name      string  `json:"name" validate:"required,min=1,max=255"`
	Address   string  `json:"address" validate:"required,min=1,max=500"`
	Latitude  float64 `json:"latitude" validate:"required"`
	Longitude float64 `json:"longitude" validate:"required"`
}

// ApproveVenueRequest represents the request to approve a venue submission
type ApproveVenueRequest struct {
	// No body needed, just the ID in the path
}

// RejectVenueRequest represents the request to reject a venue submission
type RejectVenueRequest struct {
	RejectionReason string `json:"rejection_reason" validate:"required,min=1,max=500"`
}

// CreateVenueResponse represents the response when creating a venue
type CreateVenueResponse struct {
	Venue Venue `json:"venue"`
}

// GetVenuesResponse represents the response when getting multiple venues
type GetVenuesResponse struct {
	Venues []Venue `json:"venues"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}
