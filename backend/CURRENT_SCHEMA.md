# Current Database Schema

This document outlines the current schema for all tables. Review and remove any columns you don't need, then we'll create the final consolidated migration.

---

## USERS Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                           -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',        -- ENUM: 'user', 'admin', 'organizer'
  last_login TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  currently_logged_in BOOLEAN DEFAULT false      -- Added later
);

INDEXES:
- idx_users_email ON users(email)
- idx_users_role ON users(role)
```

**Notes:** Review if you need `last_login`, `login_count`, `currently_logged_in` columns.

---

## ORGANIZATIONS Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,                           -- Changed from INT to UUID for security
  org_name TEXT NOT NULL,
  org_url TEXT,
  org_phone_number TEXT,
  org_email TEXT,
  org_address TEXT,
  created_by TEXT,                               -- Clerk user ID, FK to users
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

FOREIGN KEYS:
- fk_org_created_by → users(id) ON DELETE SET NULL

INDEXES:
- idx_organizations_org_name ON organizations(org_name)
- idx_organizations_created_by ON organizations(created_by)
```

---

## USER_ORGANIZATIONS Table (Junction)

```sql
CREATE TABLE user_organizations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,                         -- FK to users
  org_id UUID NOT NULL,                          -- FK to organizations
  role_in_org VARCHAR(50) DEFAULT 'member',      -- owner, admin, member
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_user_org UNIQUE(user_id, org_id)
);

FOREIGN KEYS:
- fk_user_id → users(id) ON DELETE CASCADE
- fk_org_id → organizations(id) ON DELETE CASCADE

INDEXES:
- idx_user_organizations_user_id
- idx_user_organizations_org_id
- idx_user_organizations_active
- idx_user_organizations_role
```

---

## SPORTS Table

```sql
CREATE TABLE sports (
  id INT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_by TEXT,                               -- Added in later migration
  created_at TIMESTAMP                           -- Added in later migration
);

INDEXES:
- idx_sports_name ON sports(name) UNIQUE
```

**Notes:** Review if you need `created_by` and `created_at` fields. These were added later but may not be needed.

---

## VENUES Table

```sql
CREATE TABLE venues (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  lng NUMERIC(9, 6),
  lat NUMERIC(9, 6),
  location geography(Point, 4326),               -- PostGIS column for spatial queries
  request_count INT                              -- Added later
);

INDEXES:
- idx_venues_name ON venues(name)
- idx_venues_location ON venues USING GIST (location)
```

**Notes:** `request_count` was mentioned as potentially not needed. Review if you need this column.

**PostGIS Extension:**
- `CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;` must be run

---

## LEAGUES Table

```sql
CREATE TABLE leagues (
  -- Original columns
  id INT PRIMARY KEY,
  org_id UUID NOT NULL,                          -- FK to organizations
  sport_id INT,                                  -- FK to sports (no constraint currently)
  division TEXT,
  registration_deadline DATE,
  season_start_date DATE,
  season_end_date DATE,
  venue_id INT,                                  -- FK to venues (no constraint currently)
  gender TEXT,
  season_details TEXT,
  registration_url TEXT,
  duration INT,
  minimum_team_players INT,
  per_game_fee NUMERIC(10, 2),

  -- Added columns
  league_name TEXT,
  game_occurrences JSONB DEFAULT '[]'::jsonb,   -- Array of {day, startTime, endTime}
  pricing_strategy pricing_strategy DEFAULT 'per_team',  -- ENUM: per_team, per_person
  pricing_amount NUMERIC(10, 2),
  pricing_per_player NUMERIC(10, 2),            -- Calculated per-player price
  status league_status DEFAULT 'pending',        -- ENUM: pending, approved, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,                               -- Clerk user ID, FK to users
  rejection_reason TEXT,
  supplemental_requests JSONB,                  -- Sport/venue data if not in DB
  draft_data JSONB                               -- Complete form submission data
);

FOREIGN KEYS:
- fk_leagues_org_id → organizations(id) ON DELETE CASCADE
- fk_leagues_sport_id → sports(id) ON DELETE SET NULL (NEEDS TO BE ADDED)
- fk_leagues_venue_id → venues(id) ON DELETE SET NULL (NEEDS TO BE ADDED)

INDEXES:
- idx_leagues_status
- idx_leagues_created_by
- idx_leagues_created_at
- idx_leagues_org_id
- idx_leagues_sport_id
```

**Notes:**
- `supplemental_requests` and `draft_data` are JSONB columns for storing structured data
- `game_occurrences` could be simplified (see notes below)
- Old columns (`game_days`, `game_start_time`, `game_end_time`, `season_fee`, `age_group`) were dropped in migration

---

## LEAGUES_DRAFTS Table

```sql
CREATE TABLE leagues_drafts (
  id INT PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE,                   -- FK to organizations
  draft_data JSONB NOT NULL,
  type TEXT,                                     -- Added later: 'draft', 'template'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT                                -- Changed from UUID to TEXT (Clerk ID)
);

FOREIGN KEYS:
- fk_leagues_drafts_org_id → organizations(id) ON DELETE CASCADE

INDEXES:
- idx_leagues_drafts_org_id
- idx_leagues_drafts_created_by
```

**Notes:**
- `type` column added for supporting multiple draft types
- `created_by` changed from UUID to TEXT for Clerk compatibility

---

## Columns to Review/Remove:

Please mark which columns should be **REMOVED** in the final schema:

### Users Table:
- [ ] `last_login` - tracking last login timestamp
- [ ] `login_count` - counting login attempts
- [ ] `currently_logged_in` - tracking current session status

### Organizations Table:
- All columns seem necessary

### Sports Table:
- [ ] `created_by` - who created the sport
- [ ] `created_at` - when sport was created

### Venues Table:
- [ ] `request_count` - counting venue requests (mentioned as not needed)

### Leagues Table:
- [ ] `league_name` - league name field
- [ ] `supplemental_requests` - storing unexisting sport/venue data
- [ ] `draft_data` - storing complete form submission

---

## Schema Simplifications to Consider:

1. **game_occurrences**: Currently JSONB array. Should we:
   - Keep as JSONB (flexible, semi-structured)
   - Use simple TEXT (concatenated string like "Mon 19:00-22:00, Wed 19:00-22:00")
   - Create separate `game_occurrences` table (normalized)

2. **Audit fields** (`created_at`, `updated_at`, `created_by`): Should these exist on all tables or just some?

3. **PostGIS for venues**: Do you need the `location` geography column and spatial queries?

---

Please review this and let me know:
1. Which columns should be removed
2. Any other schema changes needed
3. Your preference for `game_occurrences` format

Once you confirm, I'll create the final consolidated migrations.
