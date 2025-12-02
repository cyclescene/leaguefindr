import { FilterState, League, Organization, Venue, ApiResponse, PaginatedResponse } from '../types'

// ====================================
// API REQUEST TYPES
// ====================================

export interface LeagueSearchRequest {
  query?: string  // Search text query
  filters?: FilterState
  page?: number
  limit?: number
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  userLocation?: {
    lat: number
    lng: number
    radius?: number // Search radius in miles (default: 35)
  }
}

// ====================================
// API RESPONSE TYPES
// ====================================

export interface LeagueSearchResponse extends PaginatedResponse<League> {
  mapPins: Array<{
    id: string
    lat: number
    lng: number
    leagueCount: number
    leagues: League[]
  }>
  error?: string
}

export interface LeagueDetailsResponse extends ApiResponse<League | null> {
  relatedLeagues?: League[]
}

// ====================================
// API ERROR TYPES
// ====================================

export interface ApiError {
  code: string
  message: string
  details?: any
}

export class LeagueFindrApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'LeagueFindrApiError'
  }
} 