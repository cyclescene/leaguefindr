package leagues

import (
	"testing"
	"time"
)

// MockLeagueRepository is a mock implementation of RepositoryInterface for testing
type MockLeagueRepository struct {
	leagues      map[int]*League
	drafts       map[int]*LeagueDraft
	nextLeagueID int
	nextDraftID  int
}

func NewMockLeagueRepository() *MockLeagueRepository {
	return &MockLeagueRepository{
		leagues:      make(map[int]*League),
		drafts:       make(map[int]*LeagueDraft),
		nextLeagueID: 1,
		nextDraftID:  1,
	}
}

func (m *MockLeagueRepository) GetAll() ([]League, error) {
	var leagues []League
	for _, league := range m.leagues {
		leagues = append(leagues, *league)
	}
	return leagues, nil
}

func (m *MockLeagueRepository) GetAllApproved() ([]League, error) {
	var leagues []League
	for _, league := range m.leagues {
		if league.Status == LeagueStatusApproved {
			leagues = append(leagues, *league)
		}
	}
	return leagues, nil
}

func (m *MockLeagueRepository) GetByID(id int) (*League, error) {
	league, exists := m.leagues[id]
	if !exists || league.Status != LeagueStatusApproved {
		return nil, ErrLeagueNotFound
	}
	return league, nil
}

func (m *MockLeagueRepository) GetByOrgID(orgID int) ([]League, error) {
	var leagues []League
	for _, league := range m.leagues {
		if league.OrgID != nil && *league.OrgID == orgID {
			leagues = append(leagues, *league)
		}
	}
	return leagues, nil
}

func (m *MockLeagueRepository) GetByOrgIDAndStatus(orgID int, status LeagueStatus) ([]League, error) {
	var leagues []League
	for _, league := range m.leagues {
		if league.OrgID != nil && *league.OrgID == orgID && league.Status == status {
			leagues = append(leagues, *league)
		}
	}
	return leagues, nil
}

func (m *MockLeagueRepository) Create(league *League) error {
	league.ID = m.nextLeagueID
	league.CreatedAt = time.Now()
	league.UpdatedAt = time.Now()
	m.leagues[m.nextLeagueID] = league
	m.nextLeagueID++
	return nil
}

func (m *MockLeagueRepository) GetPending() ([]League, error) {
	var leagues []League
	for _, league := range m.leagues {
		if league.Status == LeagueStatusPending {
			leagues = append(leagues, *league)
		}
	}
	return leagues, nil
}

func (m *MockLeagueRepository) UpdateStatus(id int, status LeagueStatus, rejectionReason *string) error {
	league, exists := m.leagues[id]
	if !exists {
		return ErrLeagueNotFound
	}
	league.Status = status
	league.RejectionReason = rejectionReason
	league.UpdatedAt = time.Now()
	return nil
}

func (m *MockLeagueRepository) GetDraftByOrgID(orgID int) (*LeagueDraft, error) {
	for _, draft := range m.drafts {
		if draft.OrgID == orgID {
			return draft, nil
		}
	}
	return nil, nil
}

func (m *MockLeagueRepository) SaveDraft(draft *LeagueDraft) error {
	// Check if draft already exists for this org
	for id, d := range m.drafts {
		if d.OrgID == draft.OrgID {
			// Update existing draft - preserve ID and CreatedAt
			draft.ID = d.ID
			draft.CreatedAt = d.CreatedAt
			draft.UpdatedAt = time.Now()
			m.drafts[id] = draft
			return nil
		}
	}
	// Create new draft
	draft.ID = m.nextDraftID
	draft.CreatedAt = time.Now()
	draft.UpdatedAt = time.Now()
	m.drafts[m.nextDraftID] = draft
	m.nextDraftID++
	return nil
}

func (m *MockLeagueRepository) DeleteDraft(orgID int) error {
	for id, draft := range m.drafts {
		if draft.OrgID == orgID {
			delete(m.drafts, id)
			return nil
		}
	}
	return ErrDraftNotFound
}

func (m *MockLeagueRepository) GetAllDrafts() ([]LeagueDraft, error) {
	var drafts []LeagueDraft
	for _, draft := range m.drafts {
		drafts = append(drafts, *draft)
	}
	return drafts, nil
}

// Error definitions for testing
var (
	ErrLeagueNotFound = &ValidationError{msg: "league not found"}
	ErrDraftNotFound  = &ValidationError{msg: "draft not found"}
)

type ValidationError struct {
	msg string
}

func (e *ValidationError) Error() string {
	return e.msg
}

// ============= SERVICE TESTS =============

func TestGetApprovedLeagues_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID := 1
	league1 := &League{
		OrgID:      &orgID,
		LeagueName: stringPtr("League 1"),
		Status:     LeagueStatusApproved,
	}
	league2 := &League{
		OrgID:      &orgID,
		LeagueName: stringPtr("League 2"),
		Status:     LeagueStatusApproved,
	}
	league3 := &League{
		OrgID:      &orgID,
		LeagueName: stringPtr("Pending League"),
		Status:     LeagueStatusPending,
	}

	repo.Create(league1)
	repo.Create(league2)
	repo.Create(league3)

	leagues, err := service.GetApprovedLeagues()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(leagues) != 2 {
		t.Errorf("expected 2 approved leagues, got %d", len(leagues))
	}
}

func TestGetLeagueByID_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID := 1
	league := &League{
		OrgID:      &orgID,
		LeagueName: stringPtr("Test League"),
		Status:     LeagueStatusApproved,
	}
	repo.Create(league)

	retrieved, err := service.GetLeagueByID(league.ID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if retrieved.LeagueName == nil || *retrieved.LeagueName != "Test League" {
		t.Error("league name mismatch")
	}
}

func TestGetLeaguesByOrgID_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID1 := 1
	orgID2 := 2
	league1 := &League{OrgID: &orgID1, LeagueName: stringPtr("Org1 League1"), Status: LeagueStatusApproved}
	league2 := &League{OrgID: &orgID1, LeagueName: stringPtr("Org1 League2"), Status: LeagueStatusPending}
	league3 := &League{OrgID: &orgID2, LeagueName: stringPtr("Org2 League1"), Status: LeagueStatusApproved}

	repo.Create(league1)
	repo.Create(league2)
	repo.Create(league3)

	leagues, err := service.GetLeaguesByOrgID(orgID1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(leagues) != 2 {
		t.Errorf("expected 2 leagues for org1, got %d", len(leagues))
	}
}

func TestCalculatePricingPerPlayer_PerTeam(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	// Test per-team pricing: $100 / 5 players = $20 per player
	pricing := 100.0
	minPlayers := 5
	result := service.calculatePricingPerPlayer(PricingStrategyPerTeam, &pricing, &minPlayers)

	if result == nil || *result != 20.0 {
		t.Errorf("expected $20 per player, got %v", result)
	}
}

func TestCalculatePricingPerPlayer_PerTeamWithRounding(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	// Test per-team pricing with rounding: $100 / 3 players = $33.33... rounded up to $34
	pricing := 100.0
	minPlayers := 3
	result := service.calculatePricingPerPlayer(PricingStrategyPerTeam, &pricing, &minPlayers)

	if result == nil || *result != 34.0 {
		t.Errorf("expected $34 per player (rounded up), got %v", result)
	}
}

func TestCalculatePricingPerPlayer_PerPerson(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	// Test per-person pricing: $15 = $15 per player
	pricing := 15.0
	minPlayers := 5
	result := service.calculatePricingPerPlayer(PricingStrategyPerPerson, &pricing, &minPlayers)

	if result == nil || *result != 15.0 {
		t.Errorf("expected $15 per player, got %v", result)
	}
}

func TestCreateLeague_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	req := &CreateLeagueRequest{
		SportID:              1,
		LeagueName:           stringPtr("Test League"),
		Division:             stringPtr("Beginner"),
		RegistrationDeadline: stringPtr("2025-12-31"),
		SeasonStartDate:      stringPtr("2026-01-15"),
		GameOccurrences:      GameOccurrences{{Day: "Monday", StartTime: "19:00", EndTime: "21:00"}},
		PricingStrategy:      PricingStrategyPerPerson,
		PricingAmount:        float64Ptr(50.0),
		AgeGroup:             stringPtr("Adult"),
		Gender:               stringPtr("Co-ed"),
		RegistrationURL:      stringPtr("https://example.com/register"),
		Duration:             intPtr(10),
		MinimumTeamPlayers:   intPtr(5),
	}

	league, err := service.CreateLeague("user_123", req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if league.Status != LeagueStatusPending {
		t.Errorf("expected status pending, got %s", league.Status)
	}

	if league.CreatedBy == nil || *league.CreatedBy != "user_123" {
		t.Error("created_by not set correctly")
	}
}

func TestCreateLeague_InvalidDateFormat(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	req := &CreateLeagueRequest{
		SportID:              1,
		RegistrationDeadline: stringPtr("invalid-date"),
		SeasonStartDate:      stringPtr("2026-01-15"),
	}

	_, err := service.CreateLeague("user_123", req)
	if err == nil {
		t.Error("expected error for invalid date format")
	}
}

func TestApproveLeague_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID := 1
	league := &League{
		OrgID:      &orgID,
		LeagueName: stringPtr("Test League"),
		Status:     LeagueStatusPending,
	}
	repo.Create(league)
	leagueID := league.ID

	err := service.ApproveLeague(leagueID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	updated := repo.leagues[leagueID]
	if updated.Status != LeagueStatusApproved {
		t.Errorf("expected status approved, got %s", updated.Status)
	}
}

func TestRejectLeague_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID := 1
	league := &League{
		OrgID:      &orgID,
		LeagueName: stringPtr("Test League"),
		Status:     LeagueStatusPending,
	}
	repo.Create(league)
	leagueID := league.ID

	reason := "Does not meet requirements"
	err := service.RejectLeague(leagueID, reason)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	updated := repo.leagues[leagueID]
	if updated.Status != LeagueStatusRejected {
		t.Errorf("expected status rejected, got %s", updated.Status)
	}

	if updated.RejectionReason == nil || *updated.RejectionReason != reason {
		t.Errorf("expected rejection reason %s, got %v", reason, updated.RejectionReason)
	}
}

func TestRejectLeague_EmptyReason(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID := 1
	league := &League{
		OrgID:      &orgID,
		LeagueName: stringPtr("Test League"),
		Status:     LeagueStatusPending,
	}
	repo.Create(league)

	err := service.RejectLeague(league.ID, "")
	if err == nil {
		t.Error("expected error for empty rejection reason")
	}
}

// ============= DRAFT TESTS =============

func TestSaveDraft_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID := 1
	draftData := DraftData{"name": "Test League Draft", "status": "draft"}

	draft, err := service.SaveDraft(orgID, "user_123", draftData)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if draft.OrgID != orgID {
		t.Errorf("expected org_id %d, got %d", orgID, draft.OrgID)
	}

	if draft.CreatedBy == nil || *draft.CreatedBy != "user_123" {
		t.Error("created_by not set correctly")
	}
}

func TestSaveDraft_UpdateExisting(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID := 1
	draftData1 := DraftData{"name": "Original Draft"}
	draftData2 := DraftData{"name": "Updated Draft"}

	// Save initial draft
	draft1, err := service.SaveDraft(orgID, "user_123", draftData1)
	if err != nil {
		t.Fatalf("first save failed: %v", err)
	}
	originalID := draft1.ID

	// Update draft
	draft2, err := service.SaveDraft(orgID, "user_456", draftData2)
	if err != nil {
		t.Fatalf("second save failed: %v", err)
	}

	if draft2.ID != originalID {
		t.Errorf("expected same draft ID, got different ID")
	}
}

func TestGetDraft_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID := 1
	draftData := DraftData{"name": "Test Draft"}
	service.SaveDraft(orgID, "user_123", draftData)

	draft, err := service.GetDraft(orgID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if draft == nil {
		t.Error("expected draft to be returned")
	}

	if draft.OrgID != orgID {
		t.Errorf("expected org_id %d, got %d", orgID, draft.OrgID)
	}
}

func TestGetDraft_NotFound(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	draft, err := service.GetDraft(999)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if draft != nil {
		t.Error("expected nil draft for non-existent org")
	}
}

func TestDeleteDraft_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	orgID := 1
	draftData := DraftData{"name": "Test Draft"}
	service.SaveDraft(orgID, "user_123", draftData)

	err := service.DeleteDraft(orgID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	// Verify draft is deleted
	draft, _ := service.GetDraft(orgID)
	if draft != nil {
		t.Error("expected draft to be deleted")
	}
}

func TestGetAllDrafts_Success(t *testing.T) {
	repo := NewMockLeagueRepository()
	service := NewService(repo)

	// Create multiple drafts
	service.SaveDraft(1, "user_123", DraftData{"name": "Draft 1"})
	service.SaveDraft(2, "user_456", DraftData{"name": "Draft 2"})
	service.SaveDraft(3, "user_789", DraftData{"name": "Draft 3"})

	drafts, err := service.GetAllDrafts()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(drafts) != 3 {
		t.Errorf("expected 3 drafts, got %d", len(drafts))
	}
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func float64Ptr(f float64) *float64 {
	return &f
}

func intPtr(i int) *int {
	return &i
}
