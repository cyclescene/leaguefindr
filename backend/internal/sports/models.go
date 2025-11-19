package sports

// Sport represents a sport in the system (reference data)
type Sport struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

// CreateSportRequest represents the request to create/submit a new sport
type CreateSportRequest struct {
	Name string `json:"name" validate:"required,min=1,max=255"`
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
	Exists bool `json:"exists"`
}
