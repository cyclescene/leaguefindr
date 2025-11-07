package leagues

import (
	"fmt"
	"math"
	"time"

	"github.com/leaguefindr/backend/internal/auth"
	"github.com/leaguefindr/backend/internal/organizations"
)

type Service struct {
	repo       RepositoryInterface
	orgService *organizations.Service
	authService *auth.Service
}

func NewService(repo RepositoryInterface, orgService *organizations.Service, authService *auth.Service) *Service {
	return &Service{
		repo:        repo,
		orgService:  orgService,
		authService: authService,
	}
}

// ============= LEAGUE METHODS =============

// GetAllLeagues retrieves all leagues (admin only)
func (s *Service) GetAllLeagues() ([]League, error) {
	return s.repo.GetAll()
}

// GetLeaguesByOrgID retrieves all leagues for a specific organization
func (s *Service) GetLeaguesByOrgID(orgID int) ([]League, error) {
	return s.repo.GetByOrgID(orgID)
}

// GetLeaguesByOrgIDAndStatus retrieves leagues filtered by organization and status
func (s *Service) GetLeaguesByOrgIDAndStatus(orgID int, status LeagueStatus) ([]League, error) {
	if !status.IsValid() {
		return nil, fmt.Errorf("invalid league status: %s", status)
	}
	return s.repo.GetByOrgIDAndStatus(orgID, status)
}

// GetApprovedLeagues retrieves all approved leagues (public)
func (s *Service) GetApprovedLeagues() ([]League, error) {
	return s.repo.GetAllApproved()
}

// GetLeagueByID retrieves a single approved league by ID (public)
func (s *Service) GetLeagueByID(id int) (*League, error) {
	return s.repo.GetByID(id)
}

// GetPendingLeagues retrieves all pending league submissions (admin only)
func (s *Service) GetPendingLeagues() ([]League, error) {
	return s.repo.GetPending()
}

// CreateLeague creates a new league with validation and pricing calculation
func (s *Service) CreateLeague(userID string, request *CreateLeagueRequest) (*League, error) {
	if request == nil {
		return nil, fmt.Errorf("create league request cannot be nil")
	}

	// Verify user has access to the organization
	if request.OrgID == nil {
		return nil, fmt.Errorf("organization ID is required")
	}

	err := s.orgService.VerifyUserOrgAccess(userID, *request.OrgID)
	if err != nil {
		return nil, fmt.Errorf("user does not have access to this organization: %w", err)
	}

	// Validate pricing strategy
	if !request.PricingStrategy.IsValid() {
		return nil, fmt.Errorf("invalid pricing strategy: %s", request.PricingStrategy)
	}

	// Parse dates
	regDeadline, err := time.Parse("2006-01-02", *request.RegistrationDeadline)
	if err != nil {
		return nil, fmt.Errorf("invalid registration deadline format: %w", err)
	}

	seasonStart, err := time.Parse("2006-01-02", *request.SeasonStartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid season start date format: %w", err)
	}

	var seasonEnd *time.Time
	if request.SeasonEndDate != nil {
		parsedEnd, err := time.Parse("2006-01-02", *request.SeasonEndDate)
		if err != nil {
			return nil, fmt.Errorf("invalid season end date format: %w", err)
		}
		seasonEnd = &parsedEnd
	}

	// Calculate per-player pricing
	pricingPerPlayer := s.calculatePricingPerPlayer(request.PricingStrategy, request.PricingAmount, request.MinimumTeamPlayers)

	// Create league struct
	league := &League{
		OrgID:                request.OrgID,
		SportID:              request.SportID,
		LeagueName:           request.LeagueName,
		Division:             request.Division,
		RegistrationDeadline: &regDeadline,
		SeasonStartDate:      &seasonStart,
		SeasonEndDate:        seasonEnd,
		GameOccurrences:      request.GameOccurrences,
		PricingStrategy:      request.PricingStrategy,
		PricingAmount:        request.PricingAmount,
		PricingPerPlayer:     pricingPerPlayer,
		VenueID:              request.VenueID,
		AgeGroup:             request.AgeGroup,
		Gender:               request.Gender,
		SeasonDetails:        request.SeasonDetails,
		RegistrationURL:      request.RegistrationURL,
		Duration:             request.Duration,
		MinimumTeamPlayers:   request.MinimumTeamPlayers,
		PerGameFee:           request.PerGameFee,
		Status:               LeagueStatusPending,
		CreatedBy:            &userID,
	}

	// Save league
	if err := s.repo.Create(league); err != nil {
		return nil, fmt.Errorf("failed to create league: %w", err)
	}

	return league, nil
}

// ApproveLeague approves a pending league submission (admin only)
func (s *Service) ApproveLeague(userID string, id int) error {
	// Verify user is admin
	isAdmin, err := s.authService.IsUserAdmin(userID)
	if err != nil {
		return fmt.Errorf("failed to verify admin status: %w", err)
	}
	if !isAdmin {
		return fmt.Errorf("only admins can approve leagues")
	}

	return s.repo.UpdateStatus(id, LeagueStatusApproved, nil)
}

// RejectLeague rejects a pending league submission with a reason (admin only)
func (s *Service) RejectLeague(userID string, id int, rejectionReason string) error {
	// Verify user is admin
	isAdmin, err := s.authService.IsUserAdmin(userID)
	if err != nil {
		return fmt.Errorf("failed to verify admin status: %w", err)
	}
	if !isAdmin {
		return fmt.Errorf("only admins can reject leagues")
	}

	if rejectionReason == "" {
		return fmt.Errorf("rejection reason cannot be empty")
	}
	return s.repo.UpdateStatus(id, LeagueStatusRejected, &rejectionReason)
}

// ============= DRAFT METHODS =============

// GetDraft retrieves the draft for an organization
func (s *Service) GetDraft(orgID int) (*LeagueDraft, error) {
	return s.repo.GetDraftByOrgID(orgID)
}

// SaveDraft saves or updates a draft for an organization
func (s *Service) SaveDraft(orgID string, userID string, draftData DraftData) (*LeagueDraft, error) {
	if draftData == nil || len(draftData) == 0 {
		return nil, fmt.Errorf("draft data cannot be empty")
	}

	draft := &LeagueDraft{
		OrgID:     orgID,
		DraftData: draftData,
		CreatedBy: &userID,
	}

	if err := s.repo.SaveDraft(draft); err != nil {
		return nil, fmt.Errorf("failed to save draft: %w", err)
	}

	return draft, nil
}

// DeleteDraft deletes the draft for an organization
func (s *Service) DeleteDraft(orgID int) error {
	return s.repo.DeleteDraft(orgID)
}

// GetAllDrafts retrieves all league drafts across all organizations (admin only)
func (s *Service) GetAllDrafts() ([]LeagueDraft, error) {
	return s.repo.GetAllDrafts()
}

// ============= HELPER METHODS =============

// calculatePricingPerPlayer calculates the per-player price based on pricing strategy
func (s *Service) calculatePricingPerPlayer(strategy PricingStrategy, pricingAmount *float64, minimumTeamPlayers *int) *float64 {
	if pricingAmount == nil {
		return nil
	}

	var pricePerPlayer float64

	switch strategy {
	case PricingStrategyPerTeam:
		// For per-team pricing, divide team cost by minimum team players and round up
		if minimumTeamPlayers != nil && *minimumTeamPlayers > 0 {
			pricePerPlayer = math.Ceil(*pricingAmount / float64(*minimumTeamPlayers))
		} else {
			// If minimum team players not set, use pricing amount as-is
			pricePerPlayer = *pricingAmount
		}
	case PricingStrategyPerPerson:
		// For per-person pricing, use the amount directly
		pricePerPlayer = *pricingAmount
	default:
		// Default to per-person if strategy is invalid
		pricePerPlayer = *pricingAmount
	}

	return &pricePerPlayer
}
