package venues

// Venue represents a venue/location in the system (reference data)
type Venue struct {
	ID      int64   `json:"id"`
	Name    string  `json:"name"`
	Address string  `json:"address"`
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
}

// CreateVenueRequest represents the request to create/submit a new venue
type CreateVenueRequest struct {
	Name    string  `json:"name" validate:"required,min=1,max=255"`
	Address string  `json:"address" validate:"required,min=1,max=500"`
	Lat     float64 `json:"lat" validate:"required"`
	Lng     float64 `json:"lng" validate:"required"`
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

// CheckVenueExistsResponse represents the response when checking if a venue exists
type CheckVenueExistsResponse struct {
	Exists bool `json:"exists"`
}
