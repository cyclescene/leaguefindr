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

export interface DatabaseGameOccurrence {
  id: number
  league_id: string  // UUID reference
  day: string
  start_time: string
  end_time: string
  created_at: string
}

export interface DatabaseOrganization {
  id: string  // UUID
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
  id: string  // UUID
  org_id: string  // UUID
  sport_id: number
  venue_id: number
  league_name: string
  division: string | null
  registration_deadline: string  // Date string from DB
  season_start_date: string     // Date string from DB
  season_end_date: string       // Date string from DB
  pricing_strategy: string | null  // 'per_person' | 'per_team' | null
  pricing_amount: number | null
  pricing_per_player: number | null
  per_game_fee: number | null
  gender: string              // "Male" | "Female" | "Co-ed"
  season_details: string      // Long text description
  registration_url: string
  form_data?: Record<string, any> | null  // JSONB data (optional)
  created_by?: string | null   // User ID (optional)
  rejection_reason?: string | null  // (optional)
  created_at: string
  updated_at: string
  duration: number | null     // Number of weeks
  minimum_team_players: number | null
}

// Database query result with joins
export interface DatabaseLeagueWithRelations extends DatabaseLeague {
  organizations: DatabaseOrganization
  venues: DatabaseVenue
  sports: DatabaseSport
  game_occurrences: DatabaseGameOccurrence[]
}

// ====================================
// FRONTEND TYPES (User-friendly processed data)
// ====================================

export interface Organization {
  id: string  // UUID
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
  id: string  // UUID
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
  sport?: string[]       // Changed to array for multi-select (Sport names)
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

// Weekday order for sorting game occurrences
const WEEKDAY_ORDER: Record<string, number> = {
  'Monday': 0,
  'Tuesday': 1,
  'Wednesday': 2,
  'Thursday': 3,
  'Friday': 4,
  'Saturday': 5,
  'Sunday': 6,
}

export function processGameOccurrences(
  occurrences: DatabaseGameOccurrence[]
): { gameDays: GameDay[]; gameStartTime: string; gameEndTime: string } {
  if (!occurrences || occurrences.length === 0) {
    return { gameDays: [], gameStartTime: '', gameEndTime: '' }
  }

  // Extract unique days and sort by weekday order
  const uniqueDays = Array.from(new Set(occurrences.map(o => o.day)))
  const sortedDays = uniqueDays.sort((a, b) => (WEEKDAY_ORDER[a] ?? 7) - (WEEKDAY_ORDER[b] ?? 7))

  // Find earliest start time and latest end time
  const startTimes = occurrences.map(o => o.start_time).filter(Boolean)
  const endTimes = occurrences.map(o => o.end_time).filter(Boolean)

  const gameStartTime = startTimes.length > 0 ? startTimes.sort()[0] : ''
  const gameEndTime = endTimes.length > 0 ? endTimes.sort().reverse()[0] : ''

  return {
    gameDays: sortedDays as GameDay[],
    gameStartTime,
    gameEndTime,
  }
}

export function calculateSeasonFee(
  pricingStrategy: string | null,
  pricingAmount: number | null,
  pricingPerPlayer: number | null,
  minimumTeamPlayers: number | null
): number | undefined {
  // Prefer pricing_per_player if available (already calculated)
  if (pricingPerPlayer !== null && pricingPerPlayer !== undefined) {
    return pricingPerPlayer
  }

  // If no pricing amount, can't calculate
  if (pricingAmount === null || pricingAmount === undefined) {
    return undefined
  }

  // If per_person pricing, use the amount directly
  if (pricingStrategy === 'per_person') {
    return pricingAmount
  }

  // If per_team pricing, divide by minimum team players
  if (pricingStrategy === 'per_team' && minimumTeamPlayers && minimumTeamPlayers > 0) {
    return Math.round(pricingAmount / minimumTeamPlayers)
  }

  return undefined
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
  if (!dbLeague.organizations || !dbLeague.venues || !dbLeague.sports) {
    return null
  }

  try {
    // Process game occurrences
    const { gameDays, gameStartTime, gameEndTime } = processGameOccurrences(
      dbLeague.game_occurrences || []
    )

    // Calculate season fee from pricing data
    const seasonFee = calculateSeasonFee(
      dbLeague.pricing_strategy,
      dbLeague.pricing_amount,
      dbLeague.pricing_per_player,
      dbLeague.minimum_team_players
    )

    return {
      id: dbLeague.id,
      organization: mapDatabaseOrganizationToOrganization(dbLeague.organizations),
      venue: mapDatabaseVenueToVenue(dbLeague.venues),
      sport: mapDatabaseSportToSport(dbLeague.sports),
      division: dbLeague.division || undefined,
      registrationDeadline: (() => {
        const [year, month, day] = dbLeague.registration_deadline.split('-')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      })(),
      seasonStartDate: (() => {
        if (!dbLeague.season_start_date) return new Date()
        const [year, month, day] = dbLeague.season_start_date.split('-')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      })(),
      seasonEndDate: (() => {
        if (!dbLeague.season_end_date) return undefined
        const [year, month, day] = dbLeague.season_end_date.split('-')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      })(),
      gameDays,
      gameStartTime: formatTime(gameStartTime),
      gameEndTime: formatTime(gameEndTime),
      seasonFee,
      perGameFee: dbLeague.per_game_fee || undefined,
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