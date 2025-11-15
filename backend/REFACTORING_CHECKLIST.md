# Backend Refactoring Checklist

This document tracks the ongoing refactoring to support the new schema with:
- `form_data` column instead of `draft_data`
- `game_occurrences` table created on league approval
- Minimal changes needed since game occurrences are already in JSONB

## Status: IN PROGRESS

✅ **Completed:**
- [x] Renamed DraftData → FormData in models.go
- [x] Added GameOccurrenceRow struct
- [x] Updated League struct to use FormData
- [x] Updated LeagueDraft struct to use FormData
- [x] Updated GetAll, GetAllApproved, GetByID queries in repository
- [x] Moved old migrations to migration_history

⏳ **In Progress - Repository (Many Small Changes):**
Need to replace all remaining `draft_data` → `form_data` and `DraftData` → `FormData`:

1. **GetByOrgID method** - Line 172-189
2. **GetByOrgIDAndStatus method** - Line 197-209
3. **Create method** - Lines 211-275
   - Change `draftDataJSON` → `formDataJSON`
   - Change `league.DraftData` → `league.FormData`
   - Change INSERT query: `draft_data` → `form_data`
4. **GetPending method** - Line 276
5. **GetPendingWithPagination method** - Line 296
6. **GetAllWithPagination method** - Line 323
7. **UpdateLeague method** - Line 356
8. **ApproveLeagueWithTransaction method** - Needs game_occurrences INSERT logic
9. **scanLeagues helper** - All the scanning logic (Lines ~400+)
10. **Draft-related methods** - Multiple places:
    - GetDraftByOrgID (Line 502) - change to `form_data`
    - GetDraftByID (Line 536) - change to `form_data`
    - SaveDraft (Line 568+) - change to `form_data`
    - GetAllDrafts, GetDraftsByOrgID, GetTemplatesByOrgID, UpdateTemplate - all need updates

---

## Key Logic Changes Needed

### 1. ApproveLeagueWithTransaction Method

**Current behavior:**
- Updates `sport_id`, `venue_id`, `status` to approved
- That's it

**New behavior:**
```go
func (r *Repository) ApproveLeagueWithTransaction(id int, sportID *int, venueID *int) error {
    tx, err := r.db.Begin(ctx)
    if err != nil {
        return err
    }
    defer tx.Rollback(ctx)

    // 1. Get the league to access form_data with game_occurrences
    league := getLeagueByID(tx, id)

    // 2. Parse form_data for game_occurrences (stored as JSONB)
    var gameOccurrences GameOccurrences
    if err := json.Unmarshal(league.GameOccurrences, &gameOccurrences); err != nil {
        return fmt.Errorf("failed to parse game occurrences: %w", err)
    }

    // 3. INSERT into game_occurrences table for each occurrence
    for _, occurrence := range gameOccurrences {
        _, err := tx.Exec(ctx, `
            INSERT INTO game_occurrences (league_id, day, start_time, end_time)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (league_id, day) DO UPDATE SET
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time
        `, id, occurrence.Day, occurrence.StartTime, occurrence.EndTime)
        if err != nil {
            return fmt.Errorf("failed to insert game occurrence: %w", err)
        }
    }

    // 4. Update league status and IDs (existing logic)
    _, err = tx.Exec(ctx, `
        UPDATE leagues
        SET sport_id = $1, venue_id = $2, status = $3, updated_at = NOW()
        WHERE id = $4
    `, sportID, venueID, LeagueStatusApproved, id)
    if err != nil {
        return fmt.Errorf("failed to update league: %w", err)
    }

    return tx.Commit(ctx)
}
```

### 2. scanLeagues Helper Method

**What to change:**
- Line where it does: `json.Unmarshal(draftDataJSON, &league.DraftData)`
- Change to: `json.Unmarshal(formDataJSON, &league.FormData)`
- Variable name: `draftDataJSON` → `formDataJSON`
- Scan parameter variable name same

---

## Remaining Changes by File

### repository.go
- [ ] Replace all `draft_data` → `form_data` in queries (10+ places)
- [ ] Replace all `DraftData` → `FormData` in variable names (8+ places)
- [ ] Update `ApproveLeagueWithTransaction` to insert game_occurrences
- [ ] Update `scanLeagues` helper method

### service.go
- [ ] Update `ApproveLeague` service method to call repository's game_occurrences insertion
- [ ] No other changes needed - form_data handling is same as draft_data
- [ ] Update comments to reference form_data instead of draft_data

### handler.go
- [ ] No major changes needed
- [ ] API request/response already uses FormData type
- [ ] Update any comment references to draft_data

---

## Testing Checklist

### Unit Tests (handler_test.go, service_test.go)
- [ ] Test CreateLeague still works (form_data gets saved)
- [ ] Test ApproveLeague creates game_occurrences rows
- [ ] Test GetLeague returns game_occurrences from JSONB (before approval)
- [ ] Update MockRepository to handle game_occurrences insertion

### Integration Tests (on backup database)
- [ ] Run migrations on backup database
- [ ] Create a league via API - verify form_data saved
- [ ] Approve league - verify game_occurrences table has rows
- [ ] Query league - verify game_occurrences from JSONB still work
- [ ] Test CSV import via leagues_staging table

---

## Estimated Effort

- **Quick path** (1-2 hours):
  - Find/replace draft_data → form_data in all files
  - Update ApproveLeagueWithTransaction with game_occurrences logic
  - Basic testing

- **Thorough path** (3-4 hours):
  - Above plus
  - Comprehensive test coverage
  - Integration testing on backup database
  - Code review and validation

---

## Commands to Help

### Find all remaining references
```bash
grep -r "draft_data\|DraftData" backend/internal/leagues/
```

### Check what's been updated
```bash
git diff schema/consolidate-and-clean-up
```

### Run tests
```bash
go test ./internal/leagues/...
```

---

## Next Steps

1. **Complete repository refactoring** - Replace all draft_data → form_data
2. **Implement game_occurrences insertion** in ApproveLeagueWithTransaction
3. **Update service layer** to handle the game_occurrences logic
4. **Test thoroughly** on backup database
5. **Deploy migrations** and code together

## Notes

- The change is backwards-compatible if you keep the game_occurrences JSONB column
- Game occurrences are created on APPROVAL, not on creation
- The approval workflow stays the same (create sports/venues if needed, then approve)
- CSV imports automatically create game_occurrences via the trigger
