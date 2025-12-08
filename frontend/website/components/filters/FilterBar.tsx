'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, MapPin, Users, Zap, X, Calendar } from 'lucide-react'
import { FilterState, Gender } from '@/lib/types'
import { Analytics } from '@/lib/analytics'
import { SportsApi } from '@/lib/api/sports'

interface FilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  className?: string
  userLocation?: { lat: number; lng: number; radius?: number } | null
  locationName?: string | null
  onClearLocation?: () => void
}

export function FilterBar({ filters, onFiltersChange, className = '', userLocation, locationName, onClearLocation }: FilterBarProps) {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [sports, setSports] = useState<string[]>([])
  const [loadingSports, setLoadingSports] = useState(true)

  // Fetch sports from Supabase
  useEffect(() => {
    const fetchSports = async () => {
      try {
        setLoadingSports(true)
        const response = await SportsApi.getAllSports()
        if (response.success && response.data) {
          const sportNames = response.data.map((sport) => sport.name).sort()
          setSports(sportNames)
        }
      } catch (error) {
        console.error('Failed to fetch sports:', error)
        // Fallback to empty array if fetch fails
        setSports([])
      } finally {
        setLoadingSports(false)
      }
    }

    fetchSports()
  }, [])

  // Track if component is mounted (for portal)
  useEffect(() => {
    setMounted(true)
  }, [])
  const genders: Gender[] = ['Male', 'Female', 'Co-ed']
  const gameDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const toggleFilterValue = (key: keyof FilterState, value: any) => {
    const currentValues = (filters[key] as any[]) || []
    const isSelected = currentValues.includes(value)
    
    let newValues: any[]
    if (isSelected) {
      // Remove value from array
      newValues = currentValues.filter(v => v !== value)
    } else {
      // Add value to array
      newValues = [...currentValues, value]
      
      // Track filter application only when adding
      switch (key) {
        case 'sport':
          Analytics.appliedFilterSport(value)
          break
        case 'gender':
          Analytics.appliedFilterGender(value)
          break
        case 'gameDay':
          Analytics.appliedFilterDay(value)
          break
      }
    }
    
    const newFilters = { ...filters }
    if (newValues.length === 0) {
      // Remove the filter completely if no values selected
      delete newFilters[key]
    } else {
      newFilters[key] = newValues as any
    }
    
    onFiltersChange(newFilters)
    // Don't close filter on selection to allow multiple selections
  }

  // Helper function to check if a value is selected
  const isValueSelected = (key: keyof FilterState, value: any): boolean => {
    const currentValues = (filters[key] as any[]) || []
    return currentValues.includes(value)
  }

  // Helper function to get display value for filter button
  const getFilterDisplayValue = (key: keyof FilterState): string | undefined => {
    const values = (filters[key] as any[]) || []
    if (values.length === 0) return undefined
    if (values.length === 1) return values[0]
    return `${values.length} selected`
  }

  const clearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
    setExpandedFilter(null)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    setExpandedFilter(null)
  }

  // Prevent background scroll when filter is expanded on mobile
  useEffect(() => {
    const preventScroll = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (expandedFilter) {
      // More aggressive scroll prevention for mobile
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      
      // Also prevent scroll on html element
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.touchAction = 'none'
      
      // Add event listeners to completely block scroll
      document.addEventListener('touchmove', preventScroll, { passive: false })
      document.addEventListener('scroll', preventScroll, { passive: false })
      document.addEventListener('wheel', preventScroll, { passive: false })
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset'
      document.body.style.touchAction = 'auto'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
      document.body.style.height = 'unset'
      
      // Restore html element
      document.documentElement.style.overflow = 'unset'
      document.documentElement.style.touchAction = 'auto'
      
      // Remove event listeners
      document.removeEventListener('touchmove', preventScroll)
      document.removeEventListener('scroll', preventScroll)
      document.removeEventListener('wheel', preventScroll)
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.touchAction = 'auto'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
      document.body.style.height = 'unset'
      document.documentElement.style.overflow = 'unset'
      document.documentElement.style.touchAction = 'auto'
      
      // Remove event listeners
      document.removeEventListener('touchmove', preventScroll)
      document.removeEventListener('scroll', preventScroll)
      document.removeEventListener('wheel', preventScroll)
    }
  }, [expandedFilter])

  // Check if any filters have values (accounting for arrays)
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'distance') return value !== undefined
    return Array.isArray(value) ? value.length > 0 : value !== undefined
  })

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Buttons Row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {/* Location Display (if active) */}
        {userLocation && locationName && onClearLocation && (
          <div className="flex items-center gap-2 px-4 py-2 bg-light-green text-white rounded-lg text-sm font-medium whitespace-nowrap">
            <MapPin className="w-4 h-4" />
            <span>{locationName}</span>
            <button
              onClick={onClearLocation}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              aria-label="Clear location"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Sport Filter Button */}
        <FilterButton
          label="Sport"
          icon={<Zap className="w-4 h-4" />}
          value={getFilterDisplayValue('sport')}
          isExpanded={expandedFilter === 'sport'}
          onToggle={() => setExpandedFilter(expandedFilter === 'sport' ? null : 'sport')}
          onClear={() => clearFilter('sport')}
        />

        {/* Gender Filter Button */}
        <FilterButton
          label="Gender"
          icon={<Users className="w-4 h-4" />}
          value={getFilterDisplayValue('gender')}
          isExpanded={expandedFilter === 'gender'}
          onToggle={() => setExpandedFilter(expandedFilter === 'gender' ? null : 'gender')}
          onClear={() => clearFilter('gender')}
        />

        {/* Game Day Filter Button */}
        <FilterButton
          label="Day"
          icon={<Calendar className="w-4 h-4" />}
          value={getFilterDisplayValue('gameDay')}
          isExpanded={expandedFilter === 'gameDay'}
          onToggle={() => setExpandedFilter(expandedFilter === 'gameDay' ? null : 'gameDay')}
          onClear={() => clearFilter('gameDay')}
        />

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap transition-colors border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded Filter Content */}
      {expandedFilter && (
        <>
          {/* Desktop Filter Content (stays in place) */}
          <div className="hidden lg:block lg:relative lg:bg-white lg:border lg:border-gray-200 lg:rounded-lg lg:shadow-lg lg:p-6">
            {/* Close Button */}
            <div className="flex items-center justify-between p-4 lg:p-0 lg:mb-4 border-b lg:border-b-0 border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {expandedFilter === 'gameDay' ? 'Game Day' : expandedFilter === 'sport' ? 'Sport' : expandedFilter === 'gender' ? 'Gender' : expandedFilter}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Select multiple options</p>
              </div>
              <button
                onClick={() => setExpandedFilter(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div 
              className="overflow-y-auto flex-1 p-4 lg:p-0" 
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
              onTouchMove={(e) => {
                // Prevent touch events from bubbling up to prevent background scroll
                e.stopPropagation()
              }}
            >
              {/* Sport Options */}
              {expandedFilter === 'sport' && (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {sports.map((sport) => (
                    <button
                      key={sport}
                      onClick={() => toggleFilterValue('sport', sport)}
                      className={`px-3 py-2 lg:px-4 lg:py-3 text-center text-sm rounded-lg font-medium transition-all duration-200 ${
                        isValueSelected('sport', sport)
                          ? 'bg-light-green text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              )}

              {/* Gender Options */}
              {expandedFilter === 'gender' && (
                <div className="grid grid-cols-3 gap-3">
                  {genders.map((gender) => (
                    <button
                      key={gender}
                      onClick={() => toggleFilterValue('gender', gender)}
                      className={`px-3 py-2 lg:px-4 lg:py-3 text-center text-sm rounded-lg font-medium transition-all duration-200 ${
                        isValueSelected('gender', gender)
                          ? 'bg-light-green text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              )}

              {/* Game Day Options */}
              {expandedFilter === 'gameDay' && (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {gameDays.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleFilterValue('gameDay', day)}
                      className={`px-3 py-2 lg:px-4 lg:py-3 text-center text-sm rounded-lg font-medium transition-all duration-200 ${
                        isValueSelected('gameDay', day)
                          ? 'bg-light-green text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Bottom padding for mobile scroll comfort and safe area */}
              <div className="h-8 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}></div>
            </div>
          </div>
          
          {/* Mobile Filter Content (uses portal) */}
          {mounted && typeof window !== 'undefined' && createPortal(
            <>
              {/* Mobile Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 z-[998] lg:hidden"
                onClick={() => setExpandedFilter(null)}
                onTouchMove={(e) => {
                  // Prevent backdrop scroll
                  e.preventDefault()
                }}
                style={{ touchAction: 'none' }}
              />
              
              {/* Mobile Filter Content */}
              <div 
                className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl z-[999] max-h-[75vh] overflow-hidden flex flex-col safe-area-inset-bottom"
                onTouchMove={(e) => {
                  // Allow scrolling within the drawer but prevent it from bubbling up
                  e.stopPropagation()
                }}
                onTouchStart={(e) => {
                  // Prevent any touch events from reaching background
                  e.stopPropagation()
                }}
                onTouchEnd={(e) => {
                  // Prevent any touch events from reaching background
                  e.stopPropagation()
                }}
                style={{ touchAction: 'auto' }}
              >
                {/* Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {expandedFilter === 'gameDay' ? 'Game Day' : expandedFilter === 'sport' ? 'Sport' : expandedFilter === 'gender' ? 'Gender' : expandedFilter}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Select multiple options</p>
                  </div>
                  <button
                    onClick={() => setExpandedFilter(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content Area */}
                <div 
                  className="overflow-y-auto flex-1 p-4" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain'
                  }}
                  onTouchMove={(e) => {
                    // Prevent touch events from bubbling up to prevent background scroll
                    e.stopPropagation()
                  }}
                  onTouchStart={(e) => {
                    // Additional prevention for sports filter with many options
                    e.stopPropagation()
                  }}
                  onTouchEnd={(e) => {
                    // Additional prevention for sports filter with many options
                    e.stopPropagation()
                  }}
                >
                  {/* Sport Options */}
                  {expandedFilter === 'sport' && (
                    <div className="grid grid-cols-2 gap-3">
                      {sports.map((sport) => (
                        <button
                          key={sport}
                          onClick={() => toggleFilterValue('sport', sport)}
                          className={`px-3 py-2 text-center text-sm rounded-lg font-medium transition-all duration-200 ${
                            isValueSelected('sport', sport)
                              ? 'bg-light-green text-white shadow-sm'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
                          }`}
                        >
                          {sport}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Gender Options */}
                  {expandedFilter === 'gender' && (
                    <div className="grid grid-cols-3 gap-3">
                      {genders.map((gender) => (
                        <button
                          key={gender}
                          onClick={() => toggleFilterValue('gender', gender)}
                          className={`px-3 py-2 text-center text-sm rounded-lg font-medium transition-all duration-200 ${
                            isValueSelected('gender', gender)
                              ? 'bg-light-green text-white shadow-sm'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
                          }`}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Game Day Options */}
                  {expandedFilter === 'gameDay' && (
                    <div className="grid grid-cols-2 gap-3">
                      {gameDays.map((day) => (
                        <button
                          key={day}
                          onClick={() => toggleFilterValue('gameDay', day)}
                          className={`px-3 py-2 text-center text-sm rounded-lg font-medium transition-all duration-200 ${
                            isValueSelected('gameDay', day)
                              ? 'bg-light-green text-white shadow-sm'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Bottom padding for mobile scroll comfort and safe area */}
                  <div className="h-8" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}></div>
                </div>
              </div>
            </>,
            document.body
          )}
        </>
      )}
    </div>
  )
}

// Simple Filter Button Component
interface FilterButtonProps {
  label: string
  icon: React.ReactNode
  value?: any
  isExpanded: boolean
  onToggle: () => void
  onClear: () => void
}

function FilterButton({ 
  label, 
  icon, 
  value, 
  isExpanded, 
  onToggle, 
  onClear
}: FilterButtonProps) {
  return (
    <div className="relative flex items-center">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
          value
            ? 'bg-light-green text-white border-light-green shadow-sm'
            : isExpanded
            ? 'bg-gray-100 text-gray-700 border-gray-300'
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm'
        } ${value ? 'pr-10' : ''}`}
      >
        {icon}
        <span>{value ? value : label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label="Clear filter"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
} 