// ====================================
// BASE TYPES & INTERFACES
// ====================================

export interface BaseComponentProps {
  children?: React.ReactNode
  className?: string
}

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// ====================================
// BUSINESS DOMAIN TYPES
// ====================================

// Age group filter options (matching database values)
export type AgeGroup = 'Adult' | 'Youth'

// Sport categories (these match your database sport names)
export type Sport = 'Basketball' | 'Softball' | 'Football' | 'Soccer' | 'Baseball' | 'Volleyball' | 
                   'Hockey' | 'Spikeball' | 'Tennis' | 'Golf' | 'Ultimate Frisbee' | 'Dodgeball' | 
                   'Lacrosse' | 'Foot Golf' | 'Kickball' | 'Paddleball' | 'Pickleball' | 'Bowling' | 
                   'Cornhole' | 'Boxing' | 'Flag Football' | 'Cheerleading' | 'Running'

// Gender options (matching database values)
export type Gender = 'Male' | 'Female' | 'Co-ed'

// Game days (for frontend use)
export type GameDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

// ====================================
// DATABASE TYPES (Exact match to Supabase schema)
// ====================================

export interface DatabaseSport {
  id: number
  name: string
}

export interface DatabaseOrganization {
  id: number
  org_name: string
  org_url: string | null
  org_phone_number: string | null
  org_email: string | null
  org_address: string | null
}

export interface DatabaseVenue {
  id: number
  name: string
  address: string
  lng: number
  lat: number
}

export interface DatabaseLeague {
  id: number
  org_id: number
  sport_id: number
  venue_id: number
  division: string | null
  registration_deadline: string  // Date string from DB
  season_start_date: string     // Date string from DB
  season_end_date: string       // Date string from DB
  game_days: string            // JSON string like "{Tuesday,Thursday}"
  game_start_time: string      // Time string "18:00:00"
  game_end_time: string        // Time string "22:00:00"
  season_fee: number | null
  per_game_fee: number | null
  age_group: string           // "Adult" | "Youth"
  gender: string              // "Male" | "Female" | "Co-ed"
  season_details: string      // Long text description
  registration_url: string
  duration: number | null     // Number of weeks
  minimum_team_players: number | null
}

// Database query result with joins
export interface DatabaseLeagueWithRelations extends DatabaseLeague {
  organization: DatabaseOrganization
  venue: DatabaseVenue
  sport: DatabaseSport
}

// ====================================
// FRONTEND TYPES (User-friendly processed data)
// ====================================

export interface Organization {
  id: number
  name: string
  url?: string
  phoneNumber?: string
  email?: string
  address?: string
}

export interface Venue {
  id: number
  name: string
  address: string
  coordinates: {
    lng: number
    lat: number
  }
}

export interface SportInfo {
  id: number
  name: string
}

export interface League {
  id: number
  organization: Organization
  venue: Venue
  sport: SportInfo
  division?: string
  registrationDeadline: Date
  seasonStartDate: Date
  seasonEndDate: Date
  gameDays: GameDay[]
  gameStartTime: string      // Formatted time "6:00 PM"
  gameEndTime: string        // Formatted time "10:00 PM"
  seasonFee?: number
  perGameFee?: number
  ageGroup: AgeGroup
  gender: Gender
  seasonDetails: string
  registrationUrl: string
  duration?: number
  minimumTeamPlayers?: number
  // Computed fields
  distance?: number          // Distance from user location
  spotsAvailable?: number    // If we track this later
}

// ====================================
// FILTER & SEARCH TYPES
// ====================================

export interface FilterState {
  ageGroup?: AgeGroup[]  // Changed to array for multi-select
  sport?: string[]       // Changed to array for multi-select (Sport names or IDs)
  gender?: Gender[]      // Changed to array for multi-select
  gameDay?: GameDay[]    // Changed to array for multi-select
  distance?: number      // in miles (remains single value)
}

export interface SearchParams {
  query?: string
  lat?: number
  lng?: number
  filters: FilterState
}

export interface SortOption {
  field: 'distance' | 'price' | 'registration_deadline' | 'season_start_date' | 'name'
  direction: 'asc' | 'desc'
}

// ====================================
// DATA MAPPING UTILITIES
// ====================================

export function parseGameDays(gameDaysString: string): GameDay[] {
  try {
    // Parse JSON string like "{Tuesday,Thursday}" into array
    const cleaned = gameDaysString.replace(/[{}]/g, '')
    const days = cleaned.split(',').map(day => day.trim())
    return days as GameDay[]
  } catch {
    return []
  }
}

export function formatTime(timeString: string): string {
  try {
    // Convert "18:00:00" to "6:00 PM"
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  } catch {
    return timeString
  }
}

export function mapDatabaseOrganizationToOrganization(dbOrg: DatabaseOrganization): Organization {
  return {
    id: dbOrg.id,
    name: dbOrg.org_name,
    url: dbOrg.org_url || undefined,
    phoneNumber: dbOrg.org_phone_number || undefined,
    email: dbOrg.org_email || undefined,
    address: dbOrg.org_address || undefined,
  }
}

export function mapDatabaseVenueToVenue(dbVenue: DatabaseVenue): Venue {
  return {
    id: dbVenue.id,
    name: dbVenue.name,
    address: dbVenue.address,
    coordinates: {
      lng: dbVenue.lng,
      lat: dbVenue.lat,
    },
  }
}

export function mapDatabaseSportToSport(dbSport: DatabaseSport): SportInfo {
  return {
    id: dbSport.id,
    name: dbSport.name,
  }
}

export function mapDatabaseLeagueToLeague(dbLeague: DatabaseLeagueWithRelations): League | null {
  // Check if all required relationships are present
  if (!dbLeague.organization || !dbLeague.venue || !dbLeague.sport) {
    return null
  }

  try {
    return {
      id: dbLeague.id,
      organization: mapDatabaseOrganizationToOrganization(dbLeague.organization),
      venue: mapDatabaseVenueToVenue(dbLeague.venue),
      sport: mapDatabaseSportToSport(dbLeague.sport),
      division: dbLeague.division || undefined,
      registrationDeadline: new Date(dbLeague.registration_deadline),
      seasonStartDate: new Date(dbLeague.season_start_date),
      seasonEndDate: new Date(dbLeague.season_end_date),
      gameDays: parseGameDays(dbLeague.game_days),
      gameStartTime: formatTime(dbLeague.game_start_time),
      gameEndTime: formatTime(dbLeague.game_end_time),
      seasonFee: dbLeague.season_fee || undefined,
      perGameFee: dbLeague.per_game_fee || undefined,
      ageGroup: dbLeague.age_group as AgeGroup,
      gender: dbLeague.gender as Gender,
      seasonDetails: dbLeague.season_details,
      registrationUrl: dbLeague.registration_url,
      duration: dbLeague.duration || undefined,
      minimumTeamPlayers: dbLeague.minimum_team_players || undefined,
    }
  } catch (error) {
    return null
  }
}

// ====================================
// UI & NAVIGATION TYPES
// ====================================

export interface NavLink {
  href: string
  label: string
  external?: boolean
  mobileOnly?: boolean
}

export interface SocialLink {
  platform: string
  href: string
  icon: string
}

export interface FilterTileProps {
  label: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
  className?: string
}

// ====================================
// MAP & GEOLOCATION TYPES
// ====================================

export interface MapPin {
  id: string
  lat: number
  lng: number
  leagueCount: number
  leagues: League[]
}

export interface UserLocation {
  lat: number
  lng: number
  city?: string
  state?: string
  zip?: string
}

// ====================================
// API RESPONSE TYPES
// ====================================

export interface ApiResponse<T> {
  data: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LeagueSearchResponse extends PaginatedResponse<League> {
  mapPins: MapPin[]
  error?: string
} 