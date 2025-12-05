'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { useSportSearch } from '@/hooks/useSportSearch'
import { SportAutocompleteDropdown } from './SportAutocompleteDropdown'

interface Sport {
  id: number
  name: string
  status: 'approved' | 'pending' | 'rejected'
  request_count: number
}

interface SportAutocompleteProps {
  selectedSport: Sport | null
  sportSearchInput: string
  onSportChange: (sport: Sport | null) => void
  onSportSearchChange: (input: string) => void
  sportError?: string
  isViewingLeague?: boolean
}

export function SportAutocomplete({
  selectedSport,
  sportSearchInput,
  onSportChange,
  onSportSearchChange,
  sportError,
  isViewingLeague = false,
}: SportAutocompleteProps) {
  const { approvedSports } = useSportSearch()
  const [debouncedSportName, setDebouncedSportName] = useState('')
  const [showSportAutocomplete, setShowSportAutocomplete] = useState(false)

  // Debounce sport search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSportName(sportSearchInput)
      // Don't show autocomplete in view mode
      setShowSportAutocomplete(sportSearchInput.length >= 1 && !isViewingLeague)
    }, 300)
    return () => clearTimeout(timer)
  }, [sportSearchInput, isViewingLeague])

  // Filter sports suggestions
  const hasExactSportMatch =
    selectedSport && selectedSport.name.toLowerCase() === debouncedSportName.toLowerCase()
  const filteredSportSuggestions =
    showSportAutocomplete && debouncedSportName && !hasExactSportMatch
      ? approvedSports.filter(sport =>
          sport.name.toLowerCase().includes(debouncedSportName.toLowerCase())
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

  return (
    <div className="space-y-2">
      <Label htmlFor="sport_name">Sport *</Label>
      <div className="relative">
        <div className="relative">
          <Input
            id="sport_name"
            placeholder="e.g., Basketball, Football, Tennis"
            value={sportSearchInput}
            onChange={e => onSportSearchChange(e.target.value)}
            onFocus={() => sportSearchInput.length >= 1 && !selectedSport && !isViewingLeague && setShowSportAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowSportAutocomplete(false), 150)}
            onClick={(e) => e.stopPropagation()}
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
  )
}
