import { League } from '../types'
import { LeagueSearchRequest, LeagueSearchResponse, LeagueDetailsResponse } from './types'
import { supabase } from '../supabase'
import { 
  mapDatabaseLeagueToLeague, 
  DatabaseLeagueWithRelations,
  FilterState 
} from '../types'
import { calculateDistance } from '../utils'

// ====================================
// LEAGUES API - Supabase Integration
// ====================================

export class LeaguesApi {
  // Search leagues with filters, pagination, and sorting
  static async searchLeagues(request: LeagueSearchRequest): Promise<LeagueSearchResponse> {
    try {
      const supabaseClient = supabase()
      
      if (!supabaseClient) {
        throw new Error('Supabase client not initialized')
      }

      let query = supabaseClient
        .from('leagues')
        .select(
          `
          id,
          org_id,
          sport_id,
          venue_id,
          league_name,
          division,
          registration_deadline,
          season_start_date,
          season_end_date,
          pricing_strategy,
          pricing_amount,
          pricing_per_player,
          per_game_fee,
          gender,
          season_details,
          registration_url,
          created_at,
          updated_at,
          duration,
          minimum_team_players,
          organizations!org_id (
            id,
            org_name,
            org_url,
            org_phone_number,
            org_email,
            org_address
          ),
          venues!venue_id (
            id,
            name,
            address,
            lng,
            lat
          ),
          sports!sport_id (
            id,
            name
          ),
          game_occurrences!league_id (
            id,
            league_id,
            day,
            start_time,
            end_time,
            created_at
          )
        `,
          {
            count: 'exact'
          }
        )

      // Apply filters with multi-select support
      // Sport filtering: filter by sport_name in form_data JSONB
      if (request.filters?.sport && request.filters.sport.length > 0) {
        const sportConditions = request.filters.sport
          .map(sport => `form_data->>sport_name.ilike.${sport}`)
          .join(',')
        query = query.or(sportConditions)
      }

      if (request.filters?.gender && request.filters.gender.length > 0) {
        // For multiple genders, use the 'in' operator
        query = query.in('gender', request.filters.gender)
      }

      if (request.filters?.gameDay && request.filters.gameDay.length > 0) {
        // For multiple game days, we need to check if ANY of the selected days are in the game_days string
        // Build an OR condition for each selected day
        const dayConditions = request.filters.gameDay.map(day => `game_days.like.%${day}%`).join(',')
        query = query.or(dayConditions)
      }

      // Text search - improved: search across org name, division, sport name, and venue name
      if (request.query && request.query.trim()) {
        const q = request.query.trim()
        query = query.or(`organization.org_name.ilike.%${q}%,division.ilike.%${q}%,sport.name.ilike.%${q}%,venue.name.ilike.%${q}%`)
      }

      // Always filter for active leagues (registration deadline in the future, not including today if already past)
      const now = new Date()
      const todayISO = now.toISOString().split('T')[0] // YYYY-MM-DD format
      query = query.gt('registration_deadline', todayISO)

      // Determine pagination strategy based on search type
      const hasLocationFilter = !!request.userLocation
      const hasFilters = !!(
        (request.filters?.sport && request.filters.sport.length > 0) ||
        (request.filters?.gender && request.filters.gender.length > 0) ||
        (request.filters?.gameDay && request.filters.gameDay.length > 0) ||
        (request.query && request.query.trim())
      )
      
      // Default database sorting: registration deadline (earliest first)
      query = query.order('registration_deadline', { ascending: true })
      
      // Pagination setup
      const page = request.page || 1
      const limit = request.limit || 20
      let actualLimit: number
      let actualOffset: number
      
      // Always get more data to handle pagination properly in the application
      actualLimit = 2000 // Get enough data for all scenarios
      actualOffset = 0

      // Execute query
      const { data, error, count } = await query
        .range(actualOffset, actualOffset + actualLimit - 1)

      if (error) {
        return {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0
          },
          mapPins: [],
          error: `Failed to search leagues: ${error.message || 'Unknown error'}. Details: ${error.details || 'No additional details'}`
        }
      }



      // Map database results to frontend types
      const leagueResults = ((data as any) || [])
        .map((dbLeague: any) => {
          try {
            const league = mapDatabaseLeagueToLeague(dbLeague)

            // Add distance calculation if user location provided
            if (league && request.userLocation) {
              try {
                const distance = calculateDistance(
                  request.userLocation.lat,
                  request.userLocation.lng,
                  league.venue.coordinates.lat,
                  league.venue.coordinates.lng
                )
                league.distance = Math.round(distance * 10) / 10 // Round to 1 decimal
              } catch (distanceError) {
                // If distance calculation fails, skip distance but keep the league
                league.distance = undefined
              }
            }

            return league
          } catch (error) {
            // League mapping failed, skip this league
            return null
          }
        })
        .filter((league: League | null): league is League => league !== null)

      let leagues: League[] = leagueResults
      let totalCount = count

      // Filter by distance radius if user location provided
      if (request.userLocation) {
        const radius = request.userLocation.radius || 35 // Default 35 miles
        
        // Filter by distance radius - leagues should already have distance calculated
        leagues = leagues.filter(league => {
          if (league.distance === undefined) {
            // If distance calculation failed, skip this league
            return false
          }
          return league.distance <= radius
        })
        
        // IMPORTANT: Sort by distance so closest leagues appear first
        leagues.sort((a, b) => {
          const distanceA = a.distance || Infinity
          const distanceB = b.distance || Infinity
          return distanceA - distanceB
        })
        
        // Update total count to reflect distance filtering
        totalCount = leagues.length
      }

      // Apply distance-based sorting if user location provided and distance/relevance sort requested
      if (request.userLocation && request.sort?.field === 'distance') {
        // Sort by distance (closest first), maintaining database sort order for same distances
        leagues.sort((a, b) => {
          const distanceA = a.distance || Infinity
          const distanceB = b.distance || Infinity
          
          if (distanceA !== distanceB) {
            return distanceA - distanceB
          }
          
          // If same distance, maintain the database sort order
          return 0
        })
      }
      // For all other sorts (sport, name, date, price), database sorting is already applied

      // Handle pagination AFTER all filtering is complete
      // We always get more data from database, so we always need to paginate in the application
      const finalTotalCount = leagues.length // Total after all filtering/processing
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const finalLeagues = leagues.slice(startIndex, endIndex)

      // Calculate pagination info
      const totalPages = Math.ceil(finalTotalCount / limit)
      const currentPage = page
      const displayLimit = limit

      // Create map pins from unique venues (use all leagues, not just paginated ones)
      const venueMap = new Map()
      leagues.forEach(league => {
        // Skip venues with invalid coordinates
        if (!league.venue.coordinates || 
            league.venue.coordinates.lat === null || 
            league.venue.coordinates.lng === null ||
            isNaN(league.venue.coordinates.lat) ||
            isNaN(league.venue.coordinates.lng) ||
            Math.abs(league.venue.coordinates.lat) > 90 ||
            Math.abs(league.venue.coordinates.lng) > 180) {
          return
        }

        const venueKey = `${league.venue.coordinates.lat},${league.venue.coordinates.lng}`
        if (!venueMap.has(venueKey)) {
          venueMap.set(venueKey, {
            id: league.venue.id.toString(),
            lat: league.venue.coordinates.lat,
            lng: league.venue.coordinates.lng,
            leagueCount: 1,
            leagues: [league]
          })
        } else {
          const pin = venueMap.get(venueKey)
          pin.leagueCount++
          pin.leagues.push(league)
        }
      })

      return {
        data: finalLeagues,
        pagination: {
          page: currentPage,
          limit: displayLimit,
          total: finalTotalCount,
          totalPages
        },
        mapPins: Array.from(venueMap.values())
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        },
        mapPins: [],
        error: errorMessage.includes('environment variables') 
          ? 'Database connection failed. Please check Vercel environment variables.'
          : errorMessage
      }
    }
  }

  // Simple search function for the layout component
  static async searchWithFilters(
    searchQuery?: string,
    filters: FilterState = {},
    page: number = 1,
    limit: number = 20
  ): Promise<LeagueSearchResponse> {
    return this.searchLeagues({
      query: searchQuery,
      filters,
      page,
      limit
    })
  }

  // Get league by ID with full details
  static async getLeagueById(id: string): Promise<LeagueDetailsResponse> {
    try {
      const supabaseClient = supabase()
      const { data, error } = await supabaseClient
        .from('leagues')
        .select(
          `
          id,
          org_id,
          sport_id,
          venue_id,
          league_name,
          division,
          registration_deadline,
          season_start_date,
          season_end_date,
          pricing_strategy,
          pricing_amount,
          pricing_per_player,
          per_game_fee,
          gender,
          season_details,
          registration_url,
          created_at,
          updated_at,
          duration,
          minimum_team_players,
          organizations!org_id (
            id,
            org_name,
            org_url,
            org_phone_number,
            org_email,
            org_address
          ),
          venues!venue_id (
            id,
            name,
            address,
            lng,
            lat
          ),
          sports!sport_id (
            id,
            name
          ),
          game_occurrences!league_id (
            id,
            league_id,
            day,
            start_time,
            end_time,
            created_at
          )
        `,
          {
            count: 'exact'
          }
        )
        .eq('id', id)
        .single()

      if (error || !data) {
        return {
          data: null,
          success: false,
          error: error?.message || 'League not found'
        }
      }

      const league = mapDatabaseLeagueToLeague(data as any)

      return {
        data: league,
        success: true,
        error: undefined
      }

    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
} 