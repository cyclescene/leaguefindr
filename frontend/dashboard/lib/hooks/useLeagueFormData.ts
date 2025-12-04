'use client'

import { UseFormWatch } from 'react-hook-form'
import { format } from 'date-fns'
import type { AddLeagueFormData, GameOccurrence } from '@/lib/schemas/leagues'

interface DateState {
  registrationDeadline?: Date
  seasonStartDate?: Date
  seasonEndDate?: Date
}

/**
 * Hook to collect all form field values into a complete AddLeagueFormData object
 * Eliminates duplicate code collection logic that was repeated 3 times in AddLeagueForm
 */
export function useLeagueFormData(
  watch: UseFormWatch<AddLeagueFormData>,
  dates: DateState,
  gameOccurrences: GameOccurrence[]
) {
  /**
   * Collect all current form values into a single AddLeagueFormData object
   * Used for: saving drafts, updating templates, submitting leagues
   */
  const collectData = (): AddLeagueFormData => {
    return {
      sport_id: watch('sport_id'),
      sport_name: watch('sport_name'),
      venue_id: watch('venue_id'),
      venue_name: watch('venue_name'),
      venue_address: watch('venue_address'),
      venue_lat: watch('venue_lat'),
      venue_lng: watch('venue_lng'),
      league_name: watch('league_name'),
      division: watch('division'),
      gender: watch('gender'),
      registration_deadline: dates.registrationDeadline
        ? format(dates.registrationDeadline, 'yyyy-MM-dd')
        : '',
      season_start_date: dates.seasonStartDate
        ? format(dates.seasonStartDate, 'yyyy-MM-dd')
        : '',
      season_end_date: dates.seasonEndDate
        ? format(dates.seasonEndDate, 'yyyy-MM-dd')
        : null,
      season_details: watch('season_details'),
      game_occurrences: gameOccurrences,
      pricing_strategy: watch('pricing_strategy'),
      pricing_amount: watch('pricing_amount'),
      per_game_fee: watch('per_game_fee') ?? 0,
      minimum_team_players: watch('minimum_team_players'),
      registration_url: watch('registration_url'),
      duration: watch('duration'),
    }
  }

  return { collectData }
}
