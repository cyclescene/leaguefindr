package sports

import "time"

// SportStatus represents the approval status of a sport
type SportStatus string

const (
	SportStatusPending  SportStatus = "pending"
	SportStatusApproved SportStatus = "approved"
	SportStatusRejected SportStatus = "rejected"
)

// IsValid checks if the status is a valid sport status
func (s SportStatus) IsValid() bool {
	switch s {
	case SportStatusPending, SportStatusApproved, SportStatusRejected:
		return true
	default:
		return false
	}
}

// String returns the string representation of the status
func (s SportStatus) String() string {
	return string(s)
}

// Sport represents a sport in the system
type Sport struct {
	ID              int        `json:"id"`
	Name            string     `json:"name"`
	Status          SportStatus `json:"status"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	CreatedBy       *string    `json:"created_by"` // UUID of the user who submitted it
	RejectionReason *string    `json:"rejection_reason"` // Reason for rejection if applicable
	RequestCount    int        `json:"request_count"` // Number of users who have requested this sport
}

// CreateSportRequest represents the request to create/submit a new sport
type CreateSportRequest struct {
	Name string `json:"name" validate:"required,min=1,max=255"`
}

// ApproveSportRequest represents the request to approve a sport submission
type ApproveSportRequest struct {
	// No body needed, just the ID in the path
}

// RejectSportRequest represents the request to reject a sport submission
type RejectSportRequest struct {
	RejectionReason string `json:"rejection_reason" validate:"required,min=1,max=500"`
}

// CreateSportResponse represents the response when creating a sport
type CreateSportResponse struct {
	Sport Sport `json:"sport"`
}

// GetSportsResponse represents the response when getting multiple sports
type GetSportsResponse struct {
	Sports []Sport `json:"sports"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// CheckSportExistsResponse represents the response when checking if a sport exists
type CheckSportExistsResponse struct {
	Exists          bool       `json:"exists"`
	Status          SportStatus `json:"status,omitempty"`
	RejectionReason *string    `json:"rejection_reason,omitempty"`
	RequestCount    int        `json:"request_count,omitempty"` // Number of users requesting this sport
}
