# Migration History

This directory contains the original migration files that were consolidated into the final schema. These files are kept for reference and understanding the evolution of the database design.

## Schema Evolution Timeline

### Phase 1: Initial Schema Creation (Oct 25-31, 2025)

**20251025193435_create_users_table.sql**
- Created users table with basic fields
- Added user_role ENUM (user, admin, organizer)
- Tracked login_count and last_login for engagement metrics

**20251027004531_create_leagues_table.sql**
- Created initial leagues table with CSV-like format
- Columns: game_days, game_start_time, game_end_time (separate columns)
- Pricing via season_fee column
- age_group field for demographic data

**20251027005000_create_organizations_table.sql**
- Created organizations table with INT primary key
- Basic contact fields: org_url, org_phone_number, org_email, org_address

**20251027005044_create_sports_table.sql**
- Created sports reference table
- Simple: id INT, name TEXT UNIQUE

**20251027005055_create_venues_table.sql**
- Created venues reference table
- Added PostGIS support for geographical queries
- Enabled location column for spatial indexing

**20251027012250_alter_users_table.sql**
**20251028121529_alter_sports_table.sql**
**20251028210428_alter_venue_table.sql**
**20251030024329_alter_sports_table.sql**
- Various refinements and type corrections
- Added request_count columns for tracking demand

### Phase 2: Schema Refactoring (Nov 6-9, 2025)

**20251106140000_refactor_user_organization_relationship.sql**
- **Major change**: Converted organizations.id from INT to UUID
- **Major change**: Created user_organizations junction table for many-to-many relationships
- Added created_by and timestamps to organizations
- Removed organization_name from users table
- Added currently_logged_in tracking to users

**20251107000000_add_is_active_to_organizations.sql**
- Added soft-delete support with is_active flag

**20251107100000_add_type_to_drafts.sql**
**20251107110000_alter_leagues_drafts_schema.sql**
**20251107120000_fix_leagues_drafts_id.sql**
**20251107130000_allow_multiple_drafts_per_org.sql**
- Created leagues_drafts table for draft submissions
- Added type column for draft vs template support
- Changed created_by from UUID to TEXT (Clerk compatibility)

**20251108000000_add_supplemental_requests_to_leagues.sql**
- Added JSONB column for storing unexisting sport/venue data
- Supported the approval workflow for new sports/venues

**20251109000000_fix_leagues_schema.sql**
- Migrated game_days + times to game_occurrences JSONB array
- Migrated season_fee to pricing_strategy + pricing_amount
- Changed created_by from UUID to TEXT (Clerk compatibility)

**20251109100000_add_draft_data_to_leagues.sql**
**20251109110000_populate_draft_data_in_leagues.sql**
- Added draft_data JSONB column for complete form restoration
- Populated with reconstructed form submission data

### Phase 3: Final Consolidation (Nov 15, 2025)

After analysis and refinement, the schema was consolidated into 5 clean migrations:

1. **20251115082000_add_fk_leagues_sport_id.sql**
2. **20251115082100_add_fk_leagues_venue_id.sql**
3. **20251115082400_create_clean_schema.sql** ← All base tables consolidated
4. **20251115082500_create_game_occurrences_table.sql** ← Normalized game times
5. **20251115082600_create_leagues_staging_and_trigger.sql** ← CSV import pipeline

## Key Design Decisions

### Schema Simplifications

1. **Removed Columns**:
   - `request_count` from sports and venues (not needed for reference data)
   - `created_by`, `created_at` from sports and venues
   - `supplemental_requests` from leagues (simplified workflow)
   - `currently_logged_in` from users (not needed)

2. **Renamed Columns**:
   - `draft_data` → `form_data` (clearer intent)

3. **Game Occurrences**:
   - Initially JSONB array in leagues table
   - Now a separate normalized table for efficient querying by day/time
   - Allows filtering: "Find all leagues that play on Monday at 19:00"

4. **Organization IDs**:
   - Changed from INT to UUID to prevent enumeration attacks
   - Added `org_id_mapping` table for CSV imports (maps old INT IDs to new UUIDs)

### CSV Import Strategy

**Problem**: CSV exports from previous system have old schema (game_days, season_fee, etc.)

**Solution**:
- Created `leagues_staging` table that mirrors old CSV schema
- PL/pgSQL trigger automatically transforms data:
  - Parses game_days array into game_occurrences table entries
  - Converts season_fee to pricing_strategy/pricing_amount
  - Calculates pricing_per_player
  - Sets status to 'approved' (pre-vetted data)
  - Stores complete form_data JSONB for audit trail

- All leagues imported via CSV are marked as 'approved' since they're pre-vetted

### Form Data Storage

`form_data` JSONB column stores complete form submission for:
- **Drafts**: Users can save incomplete submissions
- **Templates**: Reusable form templates
- **CSV imports**: Original CSV row data for audit trail

## Migration Statistics

- **Total original migrations**: 28 files
- **Final consolidated migrations**: 5 files
- **Date range**: Oct 25 - Nov 15, 2025
- **Schema iterations**: 3 major phases

## Using This History

When implementing backend/frontend changes:
1. Check the active migrations in `/migrations/` for current schema
2. Refer to this history for understanding design decisions
3. Migration comments explain the "why" behind each change

## Notes for Future Developers

- The schema went through significant iteration as requirements evolved
- CSV import support was added late as a fallback mechanism
- The move to UUID organization IDs was a security improvement
- Form submission data is preserved in JSONB for auditability
- Game times are now in a separate table for efficient querying
