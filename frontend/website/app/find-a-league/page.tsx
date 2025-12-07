'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LeagueSearchLayout } from '@/components/layout'
import { League, FilterState } from '@/lib/types'
import { LeaguesApi } from '@/lib/api/leagues'
import { LeagueSearchRequest } from '@/lib/api/types'
import { Footer } from '@/components/layout'
import type { SortOption } from '@/components/ui/SortDropdown'
import { SORT_OPTIONS } from '@/lib/constants'

// Force dynamic rendering - this page needs to run on server/client, not prerender
export const dynamic = 'force-dynamic'

// Cache keys for sessionStorage
const CACHE_KEYS = {
  FILTERS: 'leagueFindr_filters',
  LEAGUES: 'leagueFindr_leagues',
  PAGINATION: 'leagueFindr_pagination',
  VIEW_STATE: 'leagueFindr_viewState'
}

interface CachedPagination {
  currentPage: number
  totalResults: number
  totalPages: number
}

interface CachedViewState {
  activeView: 'list' | 'map'
}

function FindALeagueContent() {
  const searchParams = useSearchParams()
  const [leagues, setLeagues] = useState<League[]>([])
  const [mapPins, setMapPins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalResults, setTotalResults] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({})
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; radius?: number } | null>(null)
  const [locationName, setLocationName] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0] as SortOption)

  // Cache management functions
  const saveToCache = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(key, JSON.stringify(data))
      } catch (e) {
        // Silently fail for sessionStorage errors
      }
    }
  }

  const loadFromCache = <T,>(key: string): T | null => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(key)
        if (!cached) return null
        
        const parsed = JSON.parse(cached)
        
        // Special handling for cached leagues - convert date strings back to Date objects
        if (key === CACHE_KEYS.LEAGUES && Array.isArray(parsed)) {
          return parsed.map((league: any) => ({
            ...league,
            registrationDeadline: new Date(league.registrationDeadline),
            seasonStartDate: new Date(league.seasonStartDate),
            seasonEndDate: new Date(league.seasonEndDate),
            // Preserve distance property if it exists
            distance: league.distance || undefined
          })) as T
        }
        
        return parsed
      } catch (e) {
        // Silently fail for sessionStorage errors
        return null
      }
    }
    return null
  }

  const clearQuickFilters = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('quickFilters')
    }
  }

  // Load leagues data
  const loadLeagues = async (newFilters?: FilterState, page: number = 1, useCache: boolean = false, customUserLocation?: { lat: number; lng: number; radius?: number } | null) => {
    const filtersToUse = newFilters || filters
    const locationToUse = customUserLocation !== undefined ? customUserLocation : userLocation
    
    // If using cache and we have cached data for this exact state, use it
    if (useCache) {
      const cachedLeagues = loadFromCache<League[]>(CACHE_KEYS.LEAGUES)
      const cachedPagination = loadFromCache<CachedPagination>(CACHE_KEYS.PAGINATION)
      const cachedFilters = loadFromCache<FilterState>(CACHE_KEYS.FILTERS)
      const cachedQuery = loadFromCache<string>('cachedSearchQuery')
      const cachedLocation = loadFromCache<any>('cachedUserLocation')
      
      // Only use cache if ALL search parameters match exactly
      if (cachedLeagues && cachedPagination && cachedFilters && 
          JSON.stringify(cachedFilters) === JSON.stringify(filtersToUse) &&
          cachedPagination.currentPage === page &&
          cachedQuery === searchQuery &&
          JSON.stringify(cachedLocation) === JSON.stringify(locationToUse)) {
        

        
        setLeagues(cachedLeagues)
        setTotalResults(cachedPagination.totalResults)
        setTotalPages(cachedPagination.totalPages)
        setCurrentPage(cachedPagination.currentPage)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      // Build search request with location and sort if available
      const searchRequest: LeagueSearchRequest = {
        query: searchQuery,
        filters: filtersToUse,
        page,
        limit: 20,
        userLocation: locationToUse || undefined,
        sort: sortOption.field !== 'relevance' && sortOption.field !== 'distance' ? {
          field: sortOption.field,
          direction: sortOption.direction
        } : undefined
      }

      const response = await LeaguesApi.searchLeagues(searchRequest)
      
      const newLeagues = response.data || []
      const newMapPins = response.mapPins || []
      const newTotalResults = response.pagination?.total || 0
      const newTotalPages = response.pagination?.totalPages || 1
      
      setLeagues(newLeagues)
      setMapPins(newMapPins)
      setTotalResults(newTotalResults)
      setTotalPages(newTotalPages)
      setCurrentPage(page)

      // Cache the results with search parameters
      saveToCache(CACHE_KEYS.LEAGUES, newLeagues)
      saveToCache(CACHE_KEYS.FILTERS, filtersToUse)
      saveToCache(CACHE_KEYS.PAGINATION, {
        currentPage: page,
        totalResults: newTotalResults,
        totalPages: newTotalPages
      })
      saveToCache('cachedSearchQuery', searchQuery)
      saveToCache('cachedUserLocation', locationToUse)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load leagues')
      setLeagues([])
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }

  // Parse URL parameters and load leagues in a single effect to prevent race conditions
  useEffect(() => {
    // Parse URL parameters first
    const location = searchParams.get('location')
    const radius = searchParams.get('radius')
    const locationNameParam = searchParams.get('locationName')
    const query = searchParams.get('query')
    
    // Parse all possible filter parameters
    const sportParam = searchParams.get('sport')
    const genderParam = searchParams.get('gender')
    const gameDayParam = searchParams.get('gameDay')
    const distanceParam = searchParams.get('distance')

    // Clear cache when there ARE URL parameters (new search from hero/navbar/quickfilters)
    // BUT NOT when returning from league detail page (which would have cached filters)
    const hasUrlParams = location || query || sportParam || genderParam || gameDayParam || distanceParam
    const isReturningFromLeagueDetail = typeof window !== 'undefined' && 
      document.referrer && 
      document.referrer.includes('/leagues/') &&
      hasUrlParams && 
      sessionStorage.getItem(CACHE_KEYS.FILTERS)
    
    if (hasUrlParams && !isReturningFromLeagueDetail && typeof window !== 'undefined') {
      sessionStorage.removeItem(CACHE_KEYS.LEAGUES)
      sessionStorage.removeItem(CACHE_KEYS.PAGINATION)
      sessionStorage.removeItem(CACHE_KEYS.FILTERS)
      sessionStorage.removeItem('quickFilters') // Also clear quick filters since we're using URL params now
    }

    let parsedUserLocation: { lat: number; lng: number; radius?: number } | null = null
    let parsedLocationName: string | null = null
    let parsedSearchQuery = ''

    // Parse location parameters
    if (location) {
      const [lat, lng] = location.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) {
        parsedUserLocation = {
          lat,
          lng,
          radius: radius ? parseInt(radius, 10) : 35
        }
        parsedLocationName = locationNameParam || 'Selected Location'
      }
    }

    // Handle text query parameter only if no location
    if (query && !location) {
      parsedSearchQuery = query
    }

    // Set state all at once
    setUserLocation(parsedUserLocation)
    setLocationName(parsedLocationName)
    setSearchQuery(parsedSearchQuery)

    // Determine initial filters
    let initialFilters: FilterState = {}
    let shouldUseCache = false
    
    // Parse filter URL parameters (highest priority)
    if (sportParam || genderParam || gameDayParam || distanceParam) {
      // Convert comma-separated values to arrays (except distance)
      if (sportParam) {
        initialFilters.sport = sportParam.split(',').map(s => s.trim())
      }
      if (genderParam) {
        initialFilters.gender = genderParam.split(',').map(s => s.trim()) as any
      }
      if (gameDayParam) {
        initialFilters.gameDay = gameDayParam.split(',').map(s => s.trim()) as any
      }
      if (distanceParam) {
        const distanceValue = parseInt(distanceParam, 10)
        if (!isNaN(distanceValue)) {
          initialFilters.distance = distanceValue
        }
      }
    } else if (typeof window !== 'undefined') {
      // If no URL params, check for cached filter state (user returning from league detail)
      const cachedFilters = loadFromCache<FilterState>(CACHE_KEYS.FILTERS)
      if (cachedFilters && Object.keys(cachedFilters).length > 0) {
        initialFilters = cachedFilters
        shouldUseCache = true
      } else {
        // Fallback: check for old quick filters from sessionStorage (for backward compatibility)
        const quickFilters = sessionStorage.getItem('quickFilters')
        if (quickFilters) {
          try {
            initialFilters = JSON.parse(quickFilters)
            clearQuickFilters() // Clear after use
          } catch (e) {
            // Silently fail for filter parsing errors
          }
        }
      }
    }
    
    setFilters(initialFilters)
    
    // Load leagues with the parsed location data immediately
    const loadInitialLeagues = async () => {
      if (shouldUseCache) {
        // Try to load cached page number
        const cachedPagination = loadFromCache<CachedPagination>(CACHE_KEYS.PAGINATION)
        const pageToLoad = cachedPagination?.currentPage || 1
        await loadLeagues(initialFilters, pageToLoad, true, parsedUserLocation)
      } else {
        await loadLeagues(initialFilters, 1, false, parsedUserLocation)
      }
      setInitialLoadComplete(true)
    }

    loadInitialLeagues()
  }, [searchParams]) // Only depend on searchParams changes
  


  // Save filters to cache whenever they change (after initial load)
  useEffect(() => {
    if (initialLoadComplete) {
      saveToCache(CACHE_KEYS.FILTERS, filters)
    }
  }, [filters, initialLoadComplete])

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
    loadLeagues(newFilters, 1)
  }

  const handlePageChange = (page: number) => {
    loadLeagues(filters, page)
  }

  // Pass view state cache functions to layout
  const handleViewStateChange = (viewState: CachedViewState) => {
    saveToCache(CACHE_KEYS.VIEW_STATE, viewState)
  }

  const getCachedViewState = (): CachedViewState | null => {
    return loadFromCache<CachedViewState>(CACHE_KEYS.VIEW_STATE)
  }

  const handleClearLocation = () => {
    setUserLocation(null)
    setLocationName(null)
    // Clear URL params by navigating to clean find-a-league page
    window.history.pushState({}, '', '/find-a-league')
    // Reload leagues without location
    loadLeagues(filters, 1, false, null)
  }

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption)
    // Reload leagues with new sort option
    setCurrentPage(1)
    loadLeagues(filters, 1)
  }

  // Apply client-side sorting only for distance and relevance (database handles other sorts)
  const sortedLeagues = sortOption.field === 'distance' || sortOption.field === 'relevance' 
    ? [...leagues].sort((a, b) => {
        if (sortOption.field === 'distance') {
          if (!a.distance && !b.distance) return 0
          if (!a.distance) return 1
          if (!b.distance) return -1
          return sortOption.direction === 'asc' ? a.distance - b.distance : b.distance - a.distance
        } else {
          // Relevance sorting (default API logic)
          if (userLocation) {
            // Sort by distance first, then by registration deadline
            if (a.distance !== b.distance) {
              const aDist = a.distance || Infinity
              const bDist = b.distance || Infinity
              return aDist - bDist
            }
          }
          // Sort by registration deadline
          const now = new Date()
          const aIsActive = a.registrationDeadline > now
          const bIsActive = b.registrationDeadline > now
          if (aIsActive && !bIsActive) return -1
          if (!aIsActive && bIsActive) return 1
          return a.registrationDeadline.getTime() - b.registrationDeadline.getTime()
        }
      })
    : leagues // Use leagues as-is for database-sorted results

  return (
    <main className="flex-1">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <LeagueSearchLayout
        leagues={sortedLeagues}
        mapPins={mapPins}
        loading={loading}
        totalResults={totalResults}
        totalPages={totalPages}
        currentPage={currentPage}
        onFiltersChange={handleFiltersChange}
        onPageChange={handlePageChange}
        filters={filters}
        onViewStateChange={handleViewStateChange}
        getCachedViewState={getCachedViewState}
        userLocation={userLocation}
        locationName={locationName}
        onClearLocation={handleClearLocation}
        sortOption={sortOption}
        onSortChange={handleSortChange}
      />
      <Footer />
    </main>
  )
}

export default function FindALeaguePage() {
  return (
    <Suspense fallback={
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-3 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-2 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </main>
    }>
      <FindALeagueContent />
    </Suspense>
  )
} 