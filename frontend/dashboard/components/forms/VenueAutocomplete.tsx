'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { useVenueSearch } from '@/hooks/useVenueSearch'
import dynamic from 'next/dynamic'

// Dynamically import AddressAutofill to avoid SSR issues
const AddressAutofill = dynamic(
  () => import('@mapbox/search-js-react').then(mod => mod.AddressAutofill),
  { ssr: false }
) as any

// Global ref to track if Mapbox dropdown is open
let isMapboxDropdownOpen = false

interface Venue {
  id: number
  name: string
  address: string
  lat: number
  lng: number
  status: 'approved' | 'pending' | 'rejected'
  request_count: number
}

interface VenueAutocompleteProps {
  selectedVenue: Venue | null
  venueSearchInput: string
  onVenueChange: (venue: Venue | null) => void
  onVenueSearchChange: (input: string) => void
  onVenueAddressChange: (featureCollection: any) => void
  venueError?: string
  isViewingLeague?: boolean
  customVenueAddress?: string
}

export function VenueAutocomplete({
  selectedVenue,
  venueSearchInput,
  onVenueChange,
  onVenueSearchChange,
  onVenueAddressChange,
  venueError,
  isViewingLeague = false,
  customVenueAddress,
}: VenueAutocompleteProps) {
  const { approvedVenues } = useVenueSearch()
  const [debouncedVenueName, setDebouncedVenueName] = useState('')
  const [showVenueAutocomplete, setShowVenueAutocomplete] = useState(false)
  const addressInputRef = useRef<HTMLInputElement>(null)

  // Monitor Mapbox AddressAutofill dropdown and stop event propagation for clicks on it
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout
    let lastEventTime = 0
    const debounceDelay = 50 // 50ms debounce to prevent excessive event handling

    const handlePointerDown = (e: PointerEvent) => {
      // Check if the click is on a Mapbox element (suggestions, dropdown items, etc)
      const target = e.target as HTMLElement
      const isMapboxElement = target.closest(
        '[class*="mapbox"], [class*="search"], [role="option"], [class*="suggestions"], [class*="suggestion"]'
      )

      if (isMapboxElement) {
        const now = Date.now()
        if (now - lastEventTime < debounceDelay) {
          return // Skip if too soon
        }
        lastEventTime = now

        // Mark that Mapbox dropdown is open
        isMapboxDropdownOpen = true
        window.dispatchEvent(new CustomEvent('mapboxDropdownOpen'))

        // Stop the event from propagating to the dialog
        e.stopPropagation()
        e.preventDefault()
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      // Also stop propagation for pointer up events on Mapbox elements
      const target = e.target as HTMLElement
      const isMapboxElement = target.closest(
        '[class*="mapbox"], [class*="search"], [role="option"], [class*="suggestions"], [class*="suggestion"]'
      )

      if (isMapboxElement) {
        const now = Date.now()
        if (now - lastEventTime < debounceDelay) {
          return // Skip if too soon
        }
        lastEventTime = now

        e.stopPropagation()
        e.preventDefault()
      }

      // Debounce the close check
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const mapboxSuggestions = document.querySelector('[class*="suggestions"]')
        if (!mapboxSuggestions || window.getComputedStyle(mapboxSuggestions).display === 'none') {
          isMapboxDropdownOpen = false
          window.dispatchEvent(new CustomEvent('mapboxDropdownClose'))
        }
      }, 100)
    }

    // Use capture phase to intercept events before they bubble up
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('pointerup', handlePointerUp, true)

    return () => {
      clearTimeout(debounceTimer)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('pointerup', handlePointerUp, true)
    }
  }, [])

  // Debounce venue search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVenueName(venueSearchInput)
      setShowVenueAutocomplete(venueSearchInput.length >= 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [venueSearchInput])

  // Filter venue suggestions
  const hasExactVenueMatch =
    selectedVenue && selectedVenue.name.toLowerCase() === debouncedVenueName.toLowerCase()
  const filteredVenueSuggestions =
    showVenueAutocomplete && debouncedVenueName && !hasExactVenueMatch
      ? approvedVenues.filter(
          venue =>
            venue.name.toLowerCase().includes(debouncedVenueName.toLowerCase()) ||
            venue.address.toLowerCase().includes(debouncedVenueName.toLowerCase())
        )
      : []

  const handleSelectVenue = (venue: Venue) => {
    onVenueChange(venue)
    onVenueSearchChange(venue.name)
    if (addressInputRef.current) {
      addressInputRef.current.value = venue.address
    }
    setShowVenueAutocomplete(false)
  }

  const handleClearVenueSelection = () => {
    onVenueChange(null)
    onVenueSearchChange('')
    if (addressInputRef.current) {
      addressInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Venue Search with Autocomplete - hidden in view mode */}
      {!isViewingLeague && (
        <div className="space-y-2">
          <Label htmlFor="venue_search">Venue (Optional)</Label>
          <p className="text-sm text-gray-600">Select from popular venues or add a new one</p>
          <div className="relative">
            <div className="relative">
              <Input
                id="venue_search"
                placeholder="e.g., Central Park Courts"
                value={venueSearchInput}
                onChange={e => onVenueSearchChange(e.target.value)}
                onFocus={() => venueSearchInput.length >= 1 && !selectedVenue && setShowVenueAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowVenueAutocomplete(false), 150)}
                maxLength={255}
                autoComplete="off"
                disabled={isViewingLeague}
                aria-invalid={venueError ? 'true' : 'false'}
              />
              {selectedVenue && !isViewingLeague && (
                <button
                  type="button"
                  onClick={handleClearVenueSelection}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Venue Autocomplete Dropdown */}
            {showVenueAutocomplete && filteredVenueSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredVenueSuggestions.map(venue => (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => {
                      handleSelectVenue(venue)
                      setShowVenueAutocomplete(false)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <p className="text-sm font-medium text-gray-900">{venue.name}</p>
                    <p className="text-xs text-gray-600">{venue.address}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {venueError && <p className="text-sm text-red-600">{venueError}</p>}
        </div>
      )}

      {/* Show label in view mode */}
      {isViewingLeague && (
        <div className="space-y-2">
          <Label>Venue</Label>
        </div>
      )}

      {/* Address field - hidden when venue is selected from dropdown or custom address is prepopulated or in view mode */}
      {!selectedVenue && !customVenueAddress && !isViewingLeague && (
        <div className="space-y-2">
          <Label htmlFor="venue_address">Search Address</Label>
          <p className="text-sm text-gray-600">Find address or enter custom location</p>
          {(() => {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
            return mapboxToken ? (
              <AddressAutofill accessToken={mapboxToken} onRetrieve={onVenueAddressChange}>
                <Input
                  ref={addressInputRef}
                  id="venue_address"
                  type="text"
                  autoComplete="address-line1"
                  placeholder="Search address..."
                  aria-invalid={venueError ? 'true' : 'false'}
                />
              </AddressAutofill>
            ) : (
              <Input
                ref={addressInputRef}
                id="venue_address"
                type="text"
                placeholder="Enter address..."
                aria-invalid={venueError ? 'true' : 'false'}
              />
            )
          })()}
        </div>
      )}

      {selectedVenue && (
        <div className="flex items-center justify-between bg-green-50 p-3 rounded-md border border-green-200">
          <div className="flex-1">
            <p className="text-sm text-green-700 font-medium">{selectedVenue.name}</p>
            <p className="text-xs text-green-600">{selectedVenue.address}</p>
          </div>
          <button
            type="button"
            onClick={handleClearVenueSelection}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Display custom venue address when prepopulated (no selectedVenue but customVenueAddress exists) */}
      {!selectedVenue && customVenueAddress && (
        <div className="flex items-start bg-blue-50 p-3 rounded-md border border-blue-200">
          <div className="flex-1">
            <p className="text-sm text-blue-700 font-medium">{venueSearchInput}</p>
            <p className="text-xs text-blue-600">{customVenueAddress}</p>
          </div>
        </div>
      )}

      {/* Display venue name only in view mode when there's no address */}
      {!selectedVenue && !customVenueAddress && isViewingLeague && venueSearchInput && (
        <div className="flex items-start bg-blue-50 p-3 rounded-md border border-blue-200">
          <div className="flex-1">
            <p className="text-sm text-blue-700 font-medium">{venueSearchInput}</p>
            <p className="text-xs text-blue-600 italic">No address provided</p>
          </div>
        </div>
      )}

      {!selectedVenue && !customVenueAddress && !isViewingLeague && addressInputRef.current?.value && (
        <p className="text-xs text-gray-500 italic">
          This venue will be created during admin approval if it doesn't exist
        </p>
      )}
    </div>
  )
}
