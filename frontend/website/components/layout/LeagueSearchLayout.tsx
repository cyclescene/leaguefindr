'use client'

import { useState } from 'react'
import { List, Map } from 'lucide-react'
import { League, FilterState, MapPin } from '@/lib/types'
import { FilterBar } from '@/components/filters/FilterBar'
import { LeagueCard } from '@/components/league'
import { SortDropdown, LocationSearch } from '@/components/ui'
import type { SortOption } from '@/components/ui/SortDropdown'
import { SORT_OPTIONS } from '@/lib/constants'
import dynamic from 'next/dynamic'

// Dynamically import the map component to avoid SSR issues
const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-1 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-green mx-auto mb-2"></div>
        <p className="text-gray-4">Loading map...</p>
      </div>
    </div>
  )
})

interface CachedViewState {
  activeView: 'list' | 'map'
}

interface LeagueSearchLayoutProps {
  leagues: League[]
  mapPins?: MapPin[]
  loading?: boolean
  totalResults?: number
  currentPage?: number
  totalPages?: number
  onFiltersChange: (filters: FilterState) => void
  onPageChange?: (page: number) => void
  className?: string
  filters?: FilterState
  onViewStateChange?: (viewState: CachedViewState) => void
  getCachedViewState?: () => CachedViewState | null
  userLocation?: { lat: number; lng: number; radius?: number } | null
  locationName?: string | null
  onClearLocation?: () => void
  sortOption?: SortOption
  onSortChange?: (option: SortOption) => void
}

export function LeagueSearchLayout({
  leagues,
  mapPins,
  loading = false,
  totalResults = 0,
  currentPage = 1,
  totalPages = 1,
  onFiltersChange,
  onPageChange,
  className = '',
  filters = {},
  onViewStateChange,
  getCachedViewState,
  userLocation,
  locationName,
  onClearLocation,
  sortOption,
  onSortChange
}: LeagueSearchLayoutProps) {
  // Initialize activeView from cache if available
  const [activeView, setActiveView] = useState<'list' | 'map'>(() => {
    const cachedViewState = getCachedViewState?.()
    return cachedViewState?.activeView || 'list'
  })
  
  const handleFiltersChange = (newFilters: FilterState) => {
    onFiltersChange(newFilters)
  }

  const handleViewChange = (view: 'list' | 'map') => {
    setActiveView(view)
    onViewStateChange?.({ activeView: view })
  }

  return (
    <div className={`min-h-screen bg-gray-1 ${className}`}>
        {/* Header with Filters Only */}
        <div className="bg-white border-b border-gray-2 sticky top-0 z-[55]">
          <div className="container mx-auto px-4">
            <div className="py-4">
              <FilterBar 
                filters={filters}
                onFiltersChange={handleFiltersChange}
                userLocation={userLocation}
                locationName={locationName}
                onClearLocation={onClearLocation}
              />
            </div>
          </div>
        </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 overflow-visible">
        {/* Desktop Layout - Split View */}
        <div className="hidden lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Left Panel - League List */}
          <div className="lg:col-span-2">
            <LeagueListPanel 
              leagues={leagues}
              loading={loading}
              totalResults={totalResults}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              sortOption={sortOption}
              onSortChange={onSortChange}
            />
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-3">
            {/* Map Header to match list panel alignment */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-dirk font-black text-xl text-gray-5">
                Map View
              </h2>
              <div className="text-sm text-gray-4">
                {totalResults} locations
              </div>
            </div>
            <div className="sticky top-24 h-[75vh]">
              <MapPanel 
                leagues={leagues} 
                mapPins={mapPins}
                userLocation={userLocation}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </div>
        </div>

        {/* Mobile Layout - Toggle View */}
        <div className="lg:hidden">
          {/* Mobile View Toggle Controls */}
          <div className="mb-6">
            <div className="flex items-center bg-gray-2 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('list')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-montserrat font-semibold text-sm transition-all duration-200 ${
                  activeView === 'list'
                    ? 'bg-white text-gray-5 shadow-sm'
                    : 'text-gray-4 hover:text-gray-5'
                }`}
              >
                <List className="w-4 h-4" />
                List View
              </button>
              <button
                onClick={() => handleViewChange('map')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-montserrat font-semibold text-sm transition-all duration-200 ${
                  activeView === 'map'
                    ? 'bg-white text-gray-5 shadow-sm'
                    : 'text-gray-4 hover:text-gray-5'
                }`}
              >
                <Map className="w-4 h-4" />
                Map View
              </button>
            </div>
          </div>

          {/* Mobile Search Bar - Only in List View */}
          {activeView === 'list' && (
            <div className="mb-6">
              <LocationSearch 
                className="w-full"
                placeholder="Search for a new location..."
                size="md"
                analyticsSource="find-league"
              />
            </div>
          )}

          {/* Mobile Content Based on Active View */}
          {activeView === 'list' ? (
            <LeagueListPanel 
              leagues={leagues}
              loading={loading}
              totalResults={totalResults}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              sortOption={sortOption}
              onSortChange={onSortChange}
            />
          ) : (
            <div className="relative overflow-visible">
              {/* Map Container with Fixed Height for Mobile */}
              <div className="h-[70vh] relative overflow-visible">
                <MapPanel 
                  key={`mobile-map-${activeView}`}
                  leagues={leagues} 
                  mapPins={mapPins}
                  userLocation={userLocation}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// League List Panel Component
interface LeagueListPanelProps {
  leagues: League[]
  loading: boolean
  totalResults: number
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  sortOption?: SortOption
  onSortChange?: (option: SortOption) => void
}

function LeagueListPanel({ leagues, loading, totalResults, currentPage = 1, totalPages = 1, onPageChange, sortOption, onSortChange }: LeagueListPanelProps) {
  return (
    <div className="flex flex-col">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-dirk font-black text-xl text-gray-5">
          {loading ? 'Searching...' : `${totalResults} Leagues Found`}
        </h2>
        {/* Sort Dropdown */}
        {onSortChange && (
          <SortDropdown
            value={sortOption}
            onChange={onSortChange}
            options={[...SORT_OPTIONS]}
          />
        )}
      </div>

      {/* League Cards Container */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {/* Loading Skeletons */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-2 p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-2 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-2 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-2 rounded w-1/2"></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-3 bg-gray-2 rounded"></div>
                      <div className="h-3 bg-gray-2 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : leagues.length > 0 ? (
          <>
            {/* League Cards */}
            {leagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
            
            {/* Pagination Controls */}
            {totalPages > 1 && onPageChange && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 mt-6 border-t border-gray-200">
                {/* Page Info - Shows first on mobile, left on desktop */}
                <div className="text-sm text-gray-500 order-1 sm:order-none text-center sm:text-left">
                  Page {currentPage} of {totalPages}
                </div>

                {/* Pagination Controls - Centered */}
                <div className="flex items-center gap-2 order-2 sm:order-none">
                  {/* Previous Button */}
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => onPageChange(pageNum)}
                          className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-light-green text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>

                {/* Spacer for desktop balance */}
                <div className="hidden sm:block w-20"></div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-4 font-montserrat">
              No leagues found. Try adjusting your search or filters.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Map Panel Component - Now with Real Interactive Map
interface MapPanelProps {
  leagues: League[]
  mapPins?: MapPin[]
  userLocation?: { lat: number; lng: number; radius?: number } | null
  filters?: FilterState
  onFiltersChange?: (filters: FilterState) => void
}

function MapPanel({ leagues, mapPins, userLocation, filters, onFiltersChange }: MapPanelProps) {
  return (
    <div className="h-full bg-gray-1 rounded-lg overflow-visible relative z-10">
      <InteractiveMap 
        leagues={leagues} 
        mapPins={mapPins}
        userLocation={userLocation}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
    </div>
  )
} 