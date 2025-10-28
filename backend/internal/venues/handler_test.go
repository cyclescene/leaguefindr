package venues

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/leaguefindr/backend/internal/auth"
)

// Helper function to create a test handler
func createTestVenueHandler() *Handler {
	venuesRepo := NewMockVenueRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(venuesRepo, authRepo)
	return NewHandler(service, auth.NewService(authRepo))
}

// Helper function to create test request body
func createVenueRequestBody(v interface{}) *bytes.Buffer {
	body := new(bytes.Buffer)
	json.NewEncoder(body).Encode(v)
	return body
}

// Helper function to set chi URL params
func setVenueChiParam(req *http.Request, key, value string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, value)
	return req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
}

// TestGetAllApprovedVenues_Public tests the public endpoint for getting approved venues
func TestGetAllApprovedVenues_Public(t *testing.T) {
	handler := createTestVenueHandler()

	// Add some test data
	venue := &Venue{Name: "Madison Square Garden", Address: "33 E 33rd St, NYC", Latitude: 40.7505, Longitude: -73.9934, Status: VenueStatusApproved}
	handler.service.repo.(*MockVenueRepository).Create(venue)

	req, err := http.NewRequest("GET", "/venues/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetAllApprovedVenues).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	expected := "application/json"
	if ct := rr.Header().Get("Content-Type"); ct != expected {
		t.Errorf("handler returned wrong content type: got %v want %v", ct, expected)
	}

	var resp GetVenuesResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if len(resp.Venues) != 1 {
		t.Errorf("expected 1 venue, got %d", len(resp.Venues))
	}
}

// TestGetAllApprovedVenues_Empty tests getting approved venues when none exist
func TestGetAllApprovedVenues_Empty(t *testing.T) {
	handler := createTestVenueHandler()

	req, err := http.NewRequest("GET", "/venues/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetAllApprovedVenues).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp GetVenuesResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if len(resp.Venues) != 0 {
		t.Errorf("expected 0 venues, got %d", len(resp.Venues))
	}
}

// TestGetVenueByID_Handler_Success tests getting a venue by valid ID
func TestGetVenueByID_Handler_Success(t *testing.T) {
	handler := createTestVenueHandler()

	venue := &Venue{Name: "Test Arena", Address: "123 Test St", Latitude: 40.5, Longitude: -73.5, Status: VenueStatusApproved}
	handler.service.repo.(*MockVenueRepository).Create(venue)

	req, err := http.NewRequest("GET", "/venues/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setVenueChiParam(req, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetVenueByID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp Venue
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp.Name != "Test Arena" {
		t.Errorf("expected Test Arena, got %s", resp.Name)
	}
}

// TestGetVenueByID_Handler_InvalidID tests getting a venue with invalid ID format
func TestGetVenueByID_Handler_InvalidID(t *testing.T) {
	handler := createTestVenueHandler()

	req, err := http.NewRequest("GET", "/venues/invalid", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setVenueChiParam(req, "id", "invalid")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetVenueByID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestGetVenueByID_Handler_NotFound tests getting a non-existent venue
func TestGetVenueByID_Handler_NotFound(t *testing.T) {
	handler := createTestVenueHandler()

	req, err := http.NewRequest("GET", "/venues/999", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setVenueChiParam(req, "id", "999")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetVenueByID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
}

// TestCreateVenue_Success tests creating a venue with valid data
func TestCreateVenue_Success(t *testing.T) {
	handler := createTestVenueHandler()

	// Create a test user
	handler.service.authRepo.(*MockAuthRepository).CreateUser("user_123", "test@example.com", "Test Org", auth.RoleUser)

	req := CreateVenueRequest{
		Name:      "New Arena",
		Address:   "456 New St",
		Latitude:  40.7128,
		Longitude: -74.0060,
	}
	body := createVenueRequestBody(req)

	httpReq, err := http.NewRequest("POST", "/venues/", body)
	if err != nil {
		t.Fatal(err)
	}

	// Add user ID header
	httpReq.Header.Set("X-Clerk-User-ID", "user_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var resp CreateVenueResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp.Venue.Name != "New Arena" {
		t.Errorf("expected New Arena, got %s", resp.Venue.Name)
	}

	if resp.Venue.Status != VenueStatusPending {
		t.Errorf("expected status pending, got %s", resp.Venue.Status)
	}
}

// TestCreateVenue_Handler_AdminAutoApproves tests that admin venues are auto-approved
func TestCreateVenue_Handler_AdminAutoApproves(t *testing.T) {
	handler := createTestVenueHandler()

	// Create admin user
	handler.service.authRepo.(*MockAuthRepository).CreateUser("admin_123", "admin@example.com", "Admin Org", auth.RoleAdmin)

	req := CreateVenueRequest{
		Name:      "Admin Arena",
		Address:   "789 Admin St",
		Latitude:  40.7580,
		Longitude: -73.9855,
	}
	body := createVenueRequestBody(req)

	httpReq, err := http.NewRequest("POST", "/venues/", body)
	if err != nil {
		t.Fatal(err)
	}

	httpReq.Header.Set("X-Clerk-User-ID", "admin_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var resp CreateVenueResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp.Venue.Status != VenueStatusApproved {
		t.Errorf("expected status approved, got %s", resp.Venue.Status)
	}
}

// TestCreateVenue_NoUserID tests creating a venue without authorization
func TestCreateVenue_NoUserID(t *testing.T) {
	handler := createTestVenueHandler()

	req := CreateVenueRequest{
		Name:      "Unauthorized Venue",
		Address:   "999 No Auth St",
		Latitude:  40.0,
		Longitude: -73.0,
	}
	body := createVenueRequestBody(req)

	httpReq, err := http.NewRequest("POST", "/venues/", body)
	if err != nil {
		t.Fatal(err)
	}

	// No user ID header

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusUnauthorized)
	}
}

// TestCreateVenue_InvalidBody tests creating a venue with invalid JSON
func TestCreateVenue_InvalidBody(t *testing.T) {
	handler := createTestVenueHandler()

	handler.service.authRepo.(*MockAuthRepository).CreateUser("user_123", "test@example.com", "Test Org", auth.RoleUser)

	httpReq, err := http.NewRequest("POST", "/venues/", bytes.NewBufferString("invalid json"))
	if err != nil {
		t.Fatal(err)
	}

	httpReq.Header.Set("X-Clerk-User-ID", "user_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestCreateVenue_MissingName tests creating a venue without name
func TestCreateVenue_MissingName(t *testing.T) {
	handler := createTestVenueHandler()

	handler.service.authRepo.(*MockAuthRepository).CreateUser("user_123", "test@example.com", "Test Org", auth.RoleUser)

	req := CreateVenueRequest{
		Name:      "",
		Address:   "123 Test St",
		Latitude:  40.0,
		Longitude: -73.0,
	}
	body := createVenueRequestBody(req)

	httpReq, err := http.NewRequest("POST", "/venues/", body)
	if err != nil {
		t.Fatal(err)
	}

	httpReq.Header.Set("X-Clerk-User-ID", "user_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestCreateVenue_Handler_StoresCoordinates tests that coordinates are properly stored
func TestCreateVenue_Handler_StoresCoordinates(t *testing.T) {
	handler := createTestVenueHandler()

	handler.service.authRepo.(*MockAuthRepository).CreateUser("user_123", "test@example.com", "Test Org", auth.RoleUser)

	req := CreateVenueRequest{
		Name:      "Coordinate Test Venue",
		Address:   "555 Coord Ave",
		Latitude:  37.7749,
		Longitude: -122.4194,
	}
	body := createVenueRequestBody(req)

	httpReq, err := http.NewRequest("POST", "/venues/", body)
	if err != nil {
		t.Fatal(err)
	}

	httpReq.Header.Set("X-Clerk-User-ID", "user_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var resp CreateVenueResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp.Venue.Latitude != 37.7749 {
		t.Errorf("expected latitude 37.7749, got %f", resp.Venue.Latitude)
	}

	if resp.Venue.Longitude != -122.4194 {
		t.Errorf("expected longitude -122.4194, got %f", resp.Venue.Longitude)
	}
}

// TestApproveVenue_Handler_Success tests approving a venue
func TestApproveVenue_Handler_Success(t *testing.T) {
	handler := createTestVenueHandler()

	// Create a pending venue
	venue := &Venue{Name: "Pending Venue", Address: "123 Pending St", Latitude: 40.0, Longitude: -73.0, Status: VenueStatusPending}
	handler.service.repo.(*MockVenueRepository).Create(venue)

	httpReq, err := http.NewRequest("PUT", "/venues/1/approve", nil)
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setVenueChiParam(httpReq, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.ApproveVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp["status"] != "approved" {
		t.Errorf("expected status approved, got %s", resp["status"])
	}
}

// TestApproveVenue_InvalidID tests approving with invalid venue ID
func TestApproveVenue_InvalidID(t *testing.T) {
	handler := createTestVenueHandler()

	httpReq, err := http.NewRequest("PUT", "/venues/invalid/approve", nil)
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setVenueChiParam(httpReq, "id", "invalid")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.ApproveVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestRejectVenue_Handler_Success tests rejecting a venue
func TestRejectVenue_Handler_Success(t *testing.T) {
	handler := createTestVenueHandler()

	// Create a pending venue
	venue := &Venue{Name: "Pending Venue", Address: "123 Pending St", Latitude: 40.0, Longitude: -73.0, Status: VenueStatusPending}
	handler.service.repo.(*MockVenueRepository).Create(venue)

	req := RejectVenueRequest{RejectionReason: "Duplicate venue"}
	body := createVenueRequestBody(req)

	httpReq, err := http.NewRequest("PUT", "/venues/1/reject", body)
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setVenueChiParam(httpReq, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.RejectVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp["status"] != "rejected" {
		t.Errorf("expected status rejected, got %s", resp["status"])
	}
}

// TestRejectVenue_Handler_InvalidBody tests rejecting with invalid body
func TestRejectVenue_Handler_InvalidBody(t *testing.T) {
	handler := createTestVenueHandler()

	venue := &Venue{Name: "Pending Venue", Address: "123 Pending St", Latitude: 40.0, Longitude: -73.0, Status: VenueStatusPending}
	handler.service.repo.(*MockVenueRepository).Create(venue)

	httpReq, err := http.NewRequest("PUT", "/venues/1/reject", bytes.NewBufferString("invalid json"))
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setVenueChiParam(httpReq, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.RejectVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestRejectVenue_Handler_EmptyReason tests rejecting with empty reason
func TestRejectVenue_Handler_EmptyReason(t *testing.T) {
	handler := createTestVenueHandler()

	venue := &Venue{Name: "Pending Venue", Address: "123 Pending St", Latitude: 40.0, Longitude: -73.0, Status: VenueStatusPending}
	handler.service.repo.(*MockVenueRepository).Create(venue)

	req := RejectVenueRequest{RejectionReason: ""}
	body := createVenueRequestBody(req)

	httpReq, err := http.NewRequest("PUT", "/venues/1/reject", body)
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setVenueChiParam(httpReq, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.RejectVenue).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestGetAllVenues_Admin tests admin endpoint for getting all venues
func TestGetAllVenues_Admin(t *testing.T) {
	handler := createTestVenueHandler()

	// Create venues with different statuses
	venue1 := &Venue{Name: "Approved Venue", Address: "123 Main St", Latitude: 40.0, Longitude: -73.0, Status: VenueStatusApproved}
	venue2 := &Venue{Name: "Pending Venue", Address: "456 Pending St", Latitude: 40.5, Longitude: -73.5, Status: VenueStatusPending}
	handler.service.repo.(*MockVenueRepository).Create(venue1)
	handler.service.repo.(*MockVenueRepository).Create(venue2)

	req, err := http.NewRequest("GET", "/venues/admin/all", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetAllVenues).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp GetVenuesResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if len(resp.Venues) != 2 {
		t.Errorf("expected 2 venues, got %d", len(resp.Venues))
	}
}

// TestGetPendingVenues_Admin tests admin endpoint for getting pending venues
func TestGetPendingVenues_Admin(t *testing.T) {
	handler := createTestVenueHandler()

	// Create venues with different statuses
	venue1 := &Venue{Name: "Approved Venue", Address: "123 Main St", Latitude: 40.0, Longitude: -73.0, Status: VenueStatusApproved}
	venue2 := &Venue{Name: "Pending Venue", Address: "456 Pending St", Latitude: 40.5, Longitude: -73.5, Status: VenueStatusPending}
	handler.service.repo.(*MockVenueRepository).Create(venue1)
	handler.service.repo.(*MockVenueRepository).Create(venue2)

	req, err := http.NewRequest("GET", "/venues/admin/pending", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetPendingVenues).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp GetVenuesResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if len(resp.Venues) != 1 {
		t.Errorf("expected 1 pending venue, got %d", len(resp.Venues))
	}

	if resp.Venues[0].Status != VenueStatusPending {
		t.Errorf("expected pending status, got %s", resp.Venues[0].Status)
	}
}
