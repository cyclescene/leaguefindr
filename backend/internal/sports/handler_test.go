package sports

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
func createTestHandler() *Handler {
	sportsRepo := NewMockSportRepository()
	authRepo := NewMockAuthRepository()
	service := NewService(sportsRepo, authRepo)
	return NewHandler(service, auth.NewService(authRepo))
}

// Helper function to create test request body
func createRequestBody(v interface{}) *bytes.Buffer {
	body := new(bytes.Buffer)
	json.NewEncoder(body).Encode(v)
	return body
}

// Helper function to set chi URL params
func setChiParam(req *http.Request, key, value string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, value)
	return req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
}

// TestGetAllApprovedSports_Public tests the public endpoint for getting approved sports
func TestGetAllApprovedSports_Public(t *testing.T) {
	handler := createTestHandler()

	// Add some test data
	sport := &Sport{Name: "Basketball", Status: SportStatusApproved}
	handler.service.repo.(*MockSportRepository).Create(sport)

	req, err := http.NewRequest("GET", "/sports/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetAllApprovedSports).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	expected := "application/json"
	if ct := rr.Header().Get("Content-Type"); ct != expected {
		t.Errorf("handler returned wrong content type: got %v want %v", ct, expected)
	}

	var resp GetSportsResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if len(resp.Sports) != 1 {
		t.Errorf("expected 1 sport, got %d", len(resp.Sports))
	}
}

// TestGetAllApprovedSports_Empty tests getting approved sports when none exist
func TestGetAllApprovedSports_Empty(t *testing.T) {
	handler := createTestHandler()

	req, err := http.NewRequest("GET", "/sports/", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetAllApprovedSports).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp GetSportsResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if len(resp.Sports) != 0 {
		t.Errorf("expected 0 sports, got %d", len(resp.Sports))
	}
}

// TestGetSportByID_Handler_Success tests getting a sport by valid ID
func TestGetSportByID_Handler_Success(t *testing.T) {
	handler := createTestHandler()

	sport := &Sport{Name: "Tennis", Status: SportStatusApproved}
	handler.service.repo.(*MockSportRepository).Create(sport)

	req, err := http.NewRequest("GET", "/sports/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetSportByID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp Sport
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp.Name != "Tennis" {
		t.Errorf("expected Tennis, got %s", resp.Name)
	}
}

// TestGetSportByID_Handler_InvalidID tests getting a sport with invalid ID format
func TestGetSportByID_Handler_InvalidID(t *testing.T) {
	handler := createTestHandler()

	req, err := http.NewRequest("GET", "/sports/invalid", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "id", "invalid")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetSportByID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestGetSportByID_Handler_NotFound tests getting a non-existent sport
func TestGetSportByID_Handler_NotFound(t *testing.T) {
	handler := createTestHandler()

	req, err := http.NewRequest("GET", "/sports/999", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "id", "999")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetSportByID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNotFound)
	}
}

// TestCreateSport_Success tests creating a sport with valid data
func TestCreateSport_Success(t *testing.T) {
	handler := createTestHandler()

	// Create a test user
	handler.service.authRepo.(*MockAuthRepository).CreateUser("user_123", "test@example.com", "Test Org", auth.RoleUser)

	req := CreateSportRequest{Name: "Volleyball"}
	body := createRequestBody(req)

	httpReq, err := http.NewRequest("POST", "/sports/", body)
	if err != nil {
		t.Fatal(err)
	}

	// Add user ID header
	httpReq.Header.Set("X-Clerk-User-ID", "user_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var resp CreateSportResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp.Sport.Name != "Volleyball" {
		t.Errorf("expected Volleyball, got %s", resp.Sport.Name)
	}

	if resp.Sport.Status != SportStatusPending {
		t.Errorf("expected status pending, got %s", resp.Sport.Status)
	}
}

// TestCreateSport_Handler_AdminAutoApproves tests that admin sports are auto-approved
func TestCreateSport_Handler_AdminAutoApproves(t *testing.T) {
	handler := createTestHandler()

	// Create admin user
	handler.service.authRepo.(*MockAuthRepository).CreateUser("admin_123", "admin@example.com", "Admin Org", auth.RoleAdmin)

	req := CreateSportRequest{Name: "Hockey"}
	body := createRequestBody(req)

	httpReq, err := http.NewRequest("POST", "/sports/", body)
	if err != nil {
		t.Fatal(err)
	}

	httpReq.Header.Set("X-Clerk-User-ID", "admin_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var resp CreateSportResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp.Sport.Status != SportStatusApproved {
		t.Errorf("expected status approved, got %s", resp.Sport.Status)
	}
}

// TestCreateSport_NoUserID tests creating a sport without authorization
func TestCreateSport_NoUserID(t *testing.T) {
	handler := createTestHandler()

	req := CreateSportRequest{Name: "Baseball"}
	body := createRequestBody(req)

	httpReq, err := http.NewRequest("POST", "/sports/", body)
	if err != nil {
		t.Fatal(err)
	}

	// No user ID header

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusUnauthorized)
	}
}

// TestCreateSport_InvalidBody tests creating a sport with invalid JSON
func TestCreateSport_InvalidBody(t *testing.T) {
	handler := createTestHandler()

	handler.service.authRepo.(*MockAuthRepository).CreateUser("user_123", "test@example.com", "Test Org", auth.RoleUser)

	httpReq, err := http.NewRequest("POST", "/sports/", bytes.NewBufferString("invalid json"))
	if err != nil {
		t.Fatal(err)
	}

	httpReq.Header.Set("X-Clerk-User-ID", "user_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestCreateSport_EmptyName tests creating a sport with empty name (validation error)
func TestCreateSport_EmptyName(t *testing.T) {
	handler := createTestHandler()

	handler.service.authRepo.(*MockAuthRepository).CreateUser("user_123", "test@example.com", "Test Org", auth.RoleUser)

	req := CreateSportRequest{Name: ""}
	body := createRequestBody(req)

	httpReq, err := http.NewRequest("POST", "/sports/", body)
	if err != nil {
		t.Fatal(err)
	}

	httpReq.Header.Set("X-Clerk-User-ID", "user_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestApproveSport_Handler_Success tests approving a sport
func TestApproveSport_Handler_Success(t *testing.T) {
	handler := createTestHandler()

	// Create a pending sport
	sport := &Sport{Name: "Pending Sport", Status: SportStatusPending}
	handler.service.repo.(*MockSportRepository).Create(sport)

	httpReq, err := http.NewRequest("PUT", "/sports/1/approve", nil)
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setChiParam(httpReq, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.ApproveSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp["status"] != "approved" {
		t.Errorf("expected status approved, got %s", resp["status"])
	}
}

// TestApproveSport_InvalidID tests approving with invalid sport ID
func TestApproveSport_InvalidID(t *testing.T) {
	handler := createTestHandler()

	httpReq, err := http.NewRequest("PUT", "/sports/invalid/approve", nil)
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setChiParam(httpReq, "id", "invalid")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.ApproveSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestRejectSport_Handler_Success tests rejecting a sport
func TestRejectSport_Handler_Success(t *testing.T) {
	handler := createTestHandler()

	// Create a pending sport
	sport := &Sport{Name: "Pending Sport", Status: SportStatusPending}
	handler.service.repo.(*MockSportRepository).Create(sport)

	req := RejectSportRequest{RejectionReason: "Not appropriate"}
	body := createRequestBody(req)

	httpReq, err := http.NewRequest("PUT", "/sports/1/reject", body)
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setChiParam(httpReq, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.RejectSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)

	if resp["status"] != "rejected" {
		t.Errorf("expected status rejected, got %s", resp["status"])
	}
}

// TestRejectSport_Handler_InvalidBody tests rejecting with invalid body
func TestRejectSport_Handler_InvalidBody(t *testing.T) {
	handler := createTestHandler()

	sport := &Sport{Name: "Pending Sport", Status: SportStatusPending}
	handler.service.repo.(*MockSportRepository).Create(sport)

	httpReq, err := http.NewRequest("PUT", "/sports/1/reject", bytes.NewBufferString("invalid json"))
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setChiParam(httpReq, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.RejectSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestRejectSport_Handler_EmptyReason tests rejecting with empty reason
func TestRejectSport_Handler_EmptyReason(t *testing.T) {
	handler := createTestHandler()

	sport := &Sport{Name: "Pending Sport", Status: SportStatusPending}
	handler.service.repo.(*MockSportRepository).Create(sport)

	req := RejectSportRequest{RejectionReason: ""}
	body := createRequestBody(req)

	httpReq, err := http.NewRequest("PUT", "/sports/1/reject", body)
	if err != nil {
		t.Fatal(err)
	}

	httpReq = setChiParam(httpReq, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.RejectSport).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

// TestGetAllSports_Admin tests admin endpoint for getting all sports
func TestGetAllSports_Admin(t *testing.T) {
	handler := createTestHandler()

	// Create sports with different statuses
	sport1 := &Sport{Name: "Approved", Status: SportStatusApproved}
	sport2 := &Sport{Name: "Pending", Status: SportStatusPending}
	handler.service.repo.(*MockSportRepository).Create(sport1)
	handler.service.repo.(*MockSportRepository).Create(sport2)

	req, err := http.NewRequest("GET", "/sports/admin/all", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetAllSports).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp GetSportsResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if len(resp.Sports) != 2 {
		t.Errorf("expected 2 sports, got %d", len(resp.Sports))
	}
}

// TestGetPendingSports_Admin tests admin endpoint for getting pending sports
func TestGetPendingSports_Admin(t *testing.T) {
	handler := createTestHandler()

	// Create sports with different statuses
	sport1 := &Sport{Name: "Approved", Status: SportStatusApproved}
	sport2 := &Sport{Name: "Pending", Status: SportStatusPending}
	handler.service.repo.(*MockSportRepository).Create(sport1)
	handler.service.repo.(*MockSportRepository).Create(sport2)

	req, err := http.NewRequest("GET", "/sports/admin/pending", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetPendingSports).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var resp GetSportsResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if len(resp.Sports) != 1 {
		t.Errorf("expected 1 pending sport, got %d", len(resp.Sports))
	}

	if resp.Sports[0].Status != SportStatusPending {
		t.Errorf("expected pending status, got %s", resp.Sports[0].Status)
	}
}
