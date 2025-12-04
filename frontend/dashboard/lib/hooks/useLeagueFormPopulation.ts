'use client'

import { UseFormSetValue } from 'react-hook-form'
import { parse } from 'date-fns'
import type { AddLeagueFormData, GameOccurrence } from '@/lib/schemas/leagues'

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

/**
 * Hook to handle pre-population of league form with existing data
 * Eliminates ~60 lines of date parsing and field setting code from AddLeagueForm
 */
export function useLeagueFormPopulation(
  setValue: UseFormSetValue<AddLeagueFormData>,
  onSportSelected?: (sport: Sport | null) => void,
  onVenueSelected?: (venue: Venue | null) => void,
  onGameOccurrencesUpdate?: (occurrences: GameOccurrence[]) => void,
  onShowNewVenueForm?: (show: boolean) => void,
  reset?: (data: Partial<AddLeagueFormData>) => void
) {
  /**
   * Populate form with pre-loaded data (from draft, template, or submission)
   * Handles date parsing and field setting
   */
  const populateForm = (data: AddLeagueFormData) => {
    if (!data) return

    // If reset is provided, use it to set all values at once (preferred method)
    if (reset) {
      reset(data)
      // Still need to handle game occurrences callback
      if (data.game_occurrences && Array.isArray(data.game_occurrences)) {
        onGameOccurrencesUpdate?.(data.game_occurrences as GameOccurrence[])
      }
    } else {
      // Fallback: Set all form fields individually
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof AddLeagueFormData]

        // Handle date fields specially - parse string to Date then set as string
        if (key === 'registration_deadline' && value) {
          try {
            const parsedDate = parse(value as string, 'yyyy-MM-dd', new Date())
            if (!isNaN(parsedDate.getTime())) {
              setValue('registration_deadline', value as string)
            }
          } catch (e) {
            console.error(`Failed to parse registration_deadline: ${value}`)
          }
        } else if (key === 'season_start_date' && value) {
          try {
            const parsedDate = parse(value as string, 'yyyy-MM-dd', new Date())
            if (!isNaN(parsedDate.getTime())) {
              setValue('season_start_date', value as string)
            }
          } catch (e) {
            console.error(`Failed to parse season_start_date: ${value}`)
          }
        } else if (key === 'season_end_date' && value) {
          try {
            const parsedDate = parse(value as string, 'yyyy-MM-dd', new Date())
            if (!isNaN(parsedDate.getTime())) {
              setValue('season_end_date', value as string)
            }
          } catch (e) {
            console.error(`Failed to parse season_end_date: ${value}`)
          }
        } else if (key === 'game_occurrences' && Array.isArray(value)) {
          setValue('game_occurrences', value as GameOccurrence[])
          onGameOccurrencesUpdate?.(value as GameOccurrence[])
        } else if (
          key !== 'game_occurrences' &&
          key !== 'registration_deadline' &&
          key !== 'season_start_date' &&
          key !== 'season_end_date'
        ) {
          // Set all other fields directly
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue(key as keyof AddLeagueFormData, value as any)
        }
      })
    }
  }

  /**
   * Set selected sport and update form
   * Prevents autocomplete dropdown from showing for pre-selected sports
   */
  const setSport = (sport: Sport | null, sportName: string = '') => {
    if (sport) {
      setValue('sport_id', sport.id)
      setValue('sport_name', sport.name)
      onSportSelected?.(sport)
    } else {
      setValue('sport_id', undefined)
      setValue('sport_name', sportName)
      onSportSelected?.(null)
    }
  }

  /**
   * Set selected venue and update form
   * Prevents autocomplete dropdown from showing for pre-selected venues
   * Shows new venue form if no venue_id is present
   */
  const setVenue = (venue: Venue | null, venueName: string = '') => {
    if (venue) {
      setValue('venue_id', venue.id)
      setValue('venue_name', venue.name)
      setValue('venue_address', venue.address)
      setValue('venue_lat', venue.lat)
      setValue('venue_lng', venue.lng)
      onVenueSelected?.(venue)
      onShowNewVenueForm?.(false)
    } else {
      setValue('venue_id', undefined)
      setValue('venue_name', venueName)
      onVenueSelected?.(null)
      // Show new venue form when no venue_id is present
      onShowNewVenueForm?.(true)
    }
  }

  return {
    populateForm,
    setSport,
    setVenue,
  }
}
