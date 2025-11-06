package leagues

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
	leaguesRepo := NewMockLeagueRepository()
	service := NewService(leaguesRepo)
	authRepo := auth.NewRepository(nil) // Will be mocked in actual tests
	return NewHandler(service, auth.NewService(authRepo))
}

// Helper function to create test request body
func createLeagueRequestBody(v interface{}) *bytes.Buffer {
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

// ============= PUBLIC LEAGUE TESTS =============

func TestGetApprovedLeagues_PublicHandler(t *testing.T) {
	handler := createTestHandler()

	// Add test data
	orgID := 1
	league := &League{
		OrgID:      &orgID,
		LeagueName: stringPtr("Basketball League"),
		Status:     LeagueStatusApproved,
	}
	handler.service.repo.(*MockLeagueRepository).Create(league)

	req, err := http.NewRequest("GET", "/leagues", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetApprovedLeagues).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	expected := "application/json"
	if ct := rr.Header().Get("Content-Type"); ct != expected {
		t.Errorf("expected content-type %s, got %s", expected, ct)
	}

	var resp GetLeaguesResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if len(resp.Leagues) != 1 {
		t.Errorf("expected 1 league, got %d", len(resp.Leagues))
	}
}

func TestGetLeagueByIDHandler_Success(t *testing.T) {
	handler := createTestHandler()

	orgID := 1
	league := &League{
		OrgID:      &orgID,
		LeagueName: stringPtr("Test League"),
		Status:     LeagueStatusApproved,
	}
	handler.service.repo.(*MockLeagueRepository).Create(league)

	req, err := http.NewRequest("GET", "/leagues/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetLeagueByID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var league_resp League
	err = json.NewDecoder(rr.Body).Decode(&league_resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if league_resp.LeagueName == nil || *league_resp.LeagueName != "Test League" {
		t.Error("league name mismatch")
	}
}

func TestGetLeagueByID_NotFound(t *testing.T) {
	handler := createTestHandler()

	req, err := http.NewRequest("GET", "/leagues/999", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "id", "999")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetLeagueByID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, status)
	}
}

func TestGetLeagueByID_InvalidID(t *testing.T) {
	handler := createTestHandler()

	req, err := http.NewRequest("GET", "/leagues/invalid", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "id", "invalid")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetLeagueByID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, status)
	}
}

// ============= CREATE LEAGUE TESTS =============

func TestCreateLeagueHandler_Success(t *testing.T) {
	handler := createTestHandler()

	req := &CreateLeagueRequest{
		SportID:              1,
		LeagueName:           stringPtr("New League"),
		Division:             stringPtr("Beginner"),
		RegistrationDeadline: stringPtr("2025-12-31"),
		SeasonStartDate:      stringPtr("2026-01-15"),
		GameOccurrences:      GameOccurrences{{Day: "Monday", StartTime: "19:00", EndTime: "21:00"}},
		PricingStrategy:      PricingStrategyPerPerson,
		PricingAmount:        float64Ptr(50.0),
		AgeGroup:             stringPtr("Adult"),
		Gender:               stringPtr("Co-ed"),
		SeasonDetails:        stringPtr("Regular season"),
		RegistrationURL:      stringPtr("https://example.com/register"),
		Duration:             intPtr(10),
		MinimumTeamPlayers:   intPtr(5),
	}

	httpReq, err := http.NewRequest("POST", "/leagues", createLeagueRequestBody(req))
	if err != nil {
		t.Fatal(err)
	}
	httpReq.Header.Set("X-Clerk-User-ID", "user_123")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateLeague).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("expected status %d, got %d", http.StatusCreated, status)
	}

	var resp CreateLeagueResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if resp.League.Status != LeagueStatusPending {
		t.Errorf("expected status pending, got %s", resp.League.Status)
	}
}

func TestCreateLeague_NoUserID(t *testing.T) {
	handler := createTestHandler()

	req := &CreateLeagueRequest{
		SportID: 1,
		Division: stringPtr("Beginner"),
		RegistrationDeadline: stringPtr("2025-12-31"),
		SeasonStartDate: stringPtr("2026-01-15"),
	}

	httpReq, err := http.NewRequest("POST", "/leagues", createLeagueRequestBody(req))
	if err != nil {
		t.Fatal(err)
	}
	// Don't set user ID

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.CreateLeague).ServeHTTP(rr, httpReq)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("expected status %d, got %d", http.StatusUnauthorized, status)
	}
}

// ============= ORGANIZATION LEAGUE TESTS =============

func TestGetLeaguesByOrgIDHandler_Success(t *testing.T) {
	handler := createTestHandler()

	orgID := 1
	league1 := &League{OrgID: &orgID, LeagueName: stringPtr("League 1"), Status: LeagueStatusApproved}
	league2 := &League{OrgID: &orgID, LeagueName: stringPtr("League 2"), Status: LeagueStatusPending}
	handler.service.repo.(*MockLeagueRepository).Create(league1)
	handler.service.repo.(*MockLeagueRepository).Create(league2)

	req, err := http.NewRequest("GET", "/leagues/org/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "orgId", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetLeaguesByOrgID).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var resp GetLeaguesResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if len(resp.Leagues) != 2 {
		t.Errorf("expected 2 leagues, got %d", len(resp.Leagues))
	}
}

// ============= ADMIN LEAGUE TESTS =============

func TestGetAllLeagues_Admin(t *testing.T) {
	handler := createTestHandler()

	orgID := 1
	league1 := &League{OrgID: &orgID, LeagueName: stringPtr("League 1"), Status: LeagueStatusApproved}
	league2 := &League{OrgID: &orgID, LeagueName: stringPtr("League 2"), Status: LeagueStatusPending}
	league3 := &League{OrgID: &orgID, LeagueName: stringPtr("League 3"), Status: LeagueStatusRejected}

	handler.service.repo.(*MockLeagueRepository).Create(league1)
	handler.service.repo.(*MockLeagueRepository).Create(league2)
	handler.service.repo.(*MockLeagueRepository).Create(league3)

	req, err := http.NewRequest("GET", "/admin/all", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetAllLeagues).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var resp GetLeaguesResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if len(resp.Leagues) != 3 {
		t.Errorf("expected 3 leagues, got %d", len(resp.Leagues))
	}
}

func TestGetPendingLeagues_Admin(t *testing.T) {
	handler := createTestHandler()

	orgID := 1
	league1 := &League{OrgID: &orgID, LeagueName: stringPtr("League 1"), Status: LeagueStatusApproved}
	league2 := &League{OrgID: &orgID, LeagueName: stringPtr("League 2"), Status: LeagueStatusPending}
	league3 := &League{OrgID: &orgID, LeagueName: stringPtr("League 3"), Status: LeagueStatusPending}

	handler.service.repo.(*MockLeagueRepository).Create(league1)
	handler.service.repo.(*MockLeagueRepository).Create(league2)
	handler.service.repo.(*MockLeagueRepository).Create(league3)

	req, err := http.NewRequest("GET", "/admin/pending", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetPendingLeagues).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var resp GetLeaguesResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if len(resp.Leagues) != 2 {
		t.Errorf("expected 2 pending leagues, got %d", len(resp.Leagues))
	}
}

func TestApproveLeagueHandler_Success(t *testing.T) {
	handler := createTestHandler()

	orgID := 1
	league := &League{OrgID: &orgID, LeagueName: stringPtr("Test League"), Status: LeagueStatusPending}
	handler.service.repo.(*MockLeagueRepository).Create(league)

	req, err := http.NewRequest("PUT", "/leagues/1/approve", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.ApproveLeague).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var resp map[string]string
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if resp["status"] != "approved" {
		t.Errorf("expected status 'approved', got %s", resp["status"])
	}
}

func TestRejectLeagueHandler_Success(t *testing.T) {
	handler := createTestHandler()

	orgID := 1
	league := &League{OrgID: &orgID, LeagueName: stringPtr("Test League"), Status: LeagueStatusPending}
	handler.service.repo.(*MockLeagueRepository).Create(league)

	req_body := RejectLeagueRequest{RejectionReason: "Does not meet requirements"}

	req, err := http.NewRequest("PUT", "/leagues/1/reject", createLeagueRequestBody(req_body))
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "id", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.RejectLeague).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var resp map[string]string
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if resp["status"] != "rejected" {
		t.Errorf("expected status 'rejected', got %s", resp["status"])
	}
}

// ============= DRAFT TESTS =============

func TestSaveDraftHandler_Success(t *testing.T) {
	handler := createTestHandler()

	draftData := DraftData{"name": "Test League Draft", "sport_id": 1}
	req_body := SaveLeagueDraftRequest{DraftData: draftData}

	req, err := http.NewRequest("POST", "/drafts", createLeagueRequestBody(req_body))
	if err != nil {
		t.Fatal(err)
	}

	req.Header.Set("X-Clerk-User-ID", "user_123")
	q := req.URL.Query()
	q.Add("org_id", "1")
	req.URL.RawQuery = q.Encode()

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.SaveDraft).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var resp GetLeagueDraftResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if resp.Draft == nil {
		t.Error("expected draft in response")
	}

	if resp.Draft.OrgID != 1 {
		t.Errorf("expected org_id 1, got %d", resp.Draft.OrgID)
	}
}

func TestGetDraftHandler_Success(t *testing.T) {
	handler := createTestHandler()

	// Save a draft first
	draftData := DraftData{"name": "Test Draft"}
	handler.service.SaveDraft(1, "user_123", draftData)

	req, err := http.NewRequest("GET", "/drafts/org/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "orgId", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetDraft).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var resp GetLeagueDraftResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if resp.Draft == nil {
		t.Error("expected draft in response")
	}
}

func TestGetAllDraftsHandler_Admin(t *testing.T) {
	handler := createTestHandler()

	// Save multiple drafts
	handler.service.SaveDraft(1, "user_123", DraftData{"name": "Draft 1"})
	handler.service.SaveDraft(2, "user_456", DraftData{"name": "Draft 2"})
	handler.service.SaveDraft(3, "user_789", DraftData{"name": "Draft 3"})

	req, err := http.NewRequest("GET", "/admin/drafts", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.GetAllDrafts).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var resp map[string][]LeagueDraft
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if len(resp["drafts"]) != 3 {
		t.Errorf("expected 3 drafts, got %d", len(resp["drafts"]))
	}
}

func TestDeleteDraftHandler_Success(t *testing.T) {
	handler := createTestHandler()

	// Save a draft first
	handler.service.SaveDraft(1, "user_123", DraftData{"name": "Test Draft"})

	req, err := http.NewRequest("DELETE", "/drafts/org/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	req = setChiParam(req, "orgId", "1")

	rr := httptest.NewRecorder()
	http.HandlerFunc(handler.DeleteDraft).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, status)
	}

	var resp map[string]string
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Errorf("failed to decode response: %v", err)
	}

	if resp["status"] != "deleted" {
		t.Errorf("expected status 'deleted', got %s", resp["status"])
	}
}
