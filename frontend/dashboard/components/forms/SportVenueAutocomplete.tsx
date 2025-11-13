'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { useSportSearch } from '@/hooks/useSportSearch'
import { useVenueSearch } from '@/hooks/useVenueSearch'
import { SportAutocompleteDropdown } from './SportAutocompleteDropdown'
import dynamic from 'next/dynamic'

// Dynamically import AddressAutofill to avoid SSR issues
const AddressAutofill = dynamic(
  () => import('@mapbox/search-js-react').then(mod => mod.AddressAutofill),
  { ssr: false }
) as any

interface Sport {
  id: number
  name: string
  status: 'approved' | 'pending' | 'rejected'
  request_count: number
}

interface Venue {
  id: number
  name: string
  address: string
  lat: number
  lng: number
  status: 'approved' | 'pending' | 'rejected'
  request_count: number
}

interface SportVenueAutocompleteProps {
  selectedSport: Sport | null
  selectedVenue: Venue | null
  sportSearchInput: string
  venueSearchInput: string
  onSportChange: (sport: Sport | null) => void
  onVenueChange: (venue: Venue | null) => void
  onSportSearchChange: (input: string) => void
  onVenueSearchChange: (input: string) => void
  onVenueAddressChange: (featureCollection: any) => void
  sportError?: string
  venueError?: string
  isViewingLeague?: boolean
}

export function SportVenueAutocomplete({
  selectedSport,
  selectedVenue,
  sportSearchInput,
  venueSearchInput,
  onSportChange,
  onVenueChange,
  onSportSearchChange,
  onVenueSearchChange,
  onVenueAddressChange,
  sportError,
  venueError,
  isViewingLeague = false,
}: SportVenueAutocompleteProps) {
  const { approvedSports } = useSportSearch()
  const { approvedVenues } = useVenueSearch()
  const [debouncedSportName, setDebouncedSportName] = useState('')
  const [showSportAutocomplete, setShowSportAutocomplete] = useState(false)
  const [debouncedVenueName, setDebouncedVenueName] = useState('')
  const [showVenueAutocomplete, setShowVenueAutocomplete] = useState(false)
  const addressInputRef = useRef<HTMLInputElement>(null)

  // Debounce sport search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSportName(sportSearchInput)
      setShowSportAutocomplete(sportSearchInput.length >= 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [sportSearchInput])

  // Debounce venue search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVenueName(venueSearchInput)
      setShowVenueAutocomplete(venueSearchInput.length >= 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [venueSearchInput])

  // Filter sports suggestions
  const hasExactSportMatch =
    selectedSport && selectedSport.name.toLowerCase() === debouncedSportName.toLowerCase()
  const filteredSportSuggestions =
    showSportAutocomplete && debouncedSportName && !hasExactSportMatch
      ? approvedSports.filter(sport =>
          sport.name.toLowerCase().includes(debouncedSportName.toLowerCase())
        )
      : []

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

  const handleSelectSport = (sport: Sport) => {
    onSportChange(sport)
    onSportSearchChange(sport.name)
    setShowSportAutocomplete(false)
  }

  const handleClearSportSelection = () => {
    onSportChange(null)
    onSportSearchChange('')
    setDebouncedSportName('')
    setShowSportAutocomplete(false)
  }

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
    <div className="space-y-6">
      {/* Sport Selection */}
      <div className="space-y-2">
        <Label htmlFor="sport_name">Sport *</Label>
        <div className="relative">
          <div className="relative">
            <Input
              id="sport_name"
              placeholder="e.g., Basketball, Football, Tennis"
              value={sportSearchInput}
              onChange={e => onSportSearchChange(e.target.value)}
              onFocus={() => sportSearchInput.length >= 1 && !selectedSport && setShowSportAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowSportAutocomplete(false), 150)}
              maxLength={255}
              autoComplete="off"
              disabled={isViewingLeague}
              aria-invalid={sportError ? 'true' : 'false'}
            />
            {selectedSport && !isViewingLeague && (
              <button
                type="button"
                onClick={handleClearSportSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sport Autocomplete Dropdown */}
          <SportAutocompleteDropdown
            show={showSportAutocomplete && filteredSportSuggestions.length > 0}
            suggestions={filteredSportSuggestions}
            onSelect={handleSelectSport}
          />
        </div>

        {sportError && <p className="text-sm text-red-600">{sportError}</p>}
      </div>

      {/* Venue Selection */}
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

      {/* Address field - hidden when venue is selected from dropdown */}
      {!selectedVenue && (
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
                  disabled={isViewingLeague}
                  aria-invalid={venueError ? 'true' : 'false'}
                />
              </AddressAutofill>
            ) : (
              <Input
                ref={addressInputRef}
                id="venue_address"
                type="text"
                placeholder="Enter address..."
                disabled={isViewingLeague}
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

      {!selectedVenue && addressInputRef.current?.value && (
        <p className="text-xs text-gray-500 italic">
          This venue will be created during admin approval if it doesn't exist
        </p>
      )}
    </div>
  )
}
