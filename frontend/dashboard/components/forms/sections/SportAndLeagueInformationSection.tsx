'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SportAutocomplete } from '../SportAutocomplete'
import { type AddLeagueFormData } from '@/lib/schemas'

interface Sport {
  id: number
  name: string
  status: 'approved' | 'pending' | 'rejected'
  request_count: number
}

interface SportAndLeagueInformationSectionProps {
  selectedSport: Sport | null
  sportSearchInput: string
  onSportChange: (sport: Sport | null) => void
  onSportSearchChange: (input: string) => void
  isViewingLeague?: boolean
}

export function SportAndLeagueInformationSection({
  selectedSport,
  sportSearchInput,
  onSportChange,
  onSportSearchChange,
  isViewingLeague = false,
}: SportAndLeagueInformationSectionProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<AddLeagueFormData>()

  const displayErrors = errors

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Sport & League Information</h3>
      <p className="text-sm text-gray-600 mb-4">TBD</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* League Name */}
        <div className="space-y-2">
          <Label htmlFor="league_name">League Name *</Label>
          <Input
            {...register('league_name')}
            id="league_name"
            type="text"
            placeholder="e.g., Summer Basketball League"
            disabled={isViewingLeague}
            aria-invalid={displayErrors.league_name ? 'true' : 'false'}
          />
          {displayErrors.league_name && (
            <p className="text-sm text-red-600">{displayErrors.league_name.message}</p>
          )}
        </div>

        {/* Sport Autocomplete */}
        <div>
          <SportAutocomplete
            selectedSport={selectedSport}
            sportSearchInput={sportSearchInput}
            onSportChange={(sport) => {
              onSportChange(sport)
              if (sport) {
                setValue('sport_id', sport.id)
                setValue('sport_name', sport.name)
              } else {
                setValue('sport_id', undefined)
                setValue('sport_name', '')
              }
            }}
            onSportSearchChange={(input) => {
              onSportSearchChange(input)
              setValue('sport_name', input)
            }}
            sportError={displayErrors.sport_name?.message}
            isViewingLeague={isViewingLeague}
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <select
            {...register('gender')}
            id="gender"
            disabled={isViewingLeague}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
            aria-invalid={displayErrors.gender ? 'true' : 'false'}
          >
            <option value="">Select a gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="co-ed">Co-ed</option>
          </select>
          {displayErrors.gender && (
            <p className="text-sm text-red-600">{displayErrors.gender.message}</p>
          )}
        </div>

        {/* Skill Level */}
        <div className="space-y-2">
          <Label htmlFor="division">Skill Level *</Label>
          <input
            {...register('division')}
            id="division"
            type="text"
            placeholder="e.g., Beginner, Intermediate, Expert"
            disabled={isViewingLeague}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
            aria-invalid={displayErrors.division ? 'true' : 'false'}
          />
          {displayErrors.division && (
            <p className="text-sm text-red-600">{displayErrors.division.message}</p>
          )}
        </div>

        {/* Minimum Team Players */}
        <div className="space-y-2">
          <Label htmlFor="minimum_team_players">Minimum Team Players *</Label>
          <Input
            {...register('minimum_team_players', { valueAsNumber: true })}
            id="minimum_team_players"
            type="number"
            placeholder="5"
            disabled={isViewingLeague}
            aria-invalid={displayErrors.minimum_team_players ? 'true' : 'false'}
            onWheel={(e) => e.currentTarget.blur()}
          />
          {displayErrors.minimum_team_players && (
            <p className="text-sm text-red-600">{displayErrors.minimum_team_players.message}</p>
          )}
        </div>

        {/* Website Registration URL */}
        <div className="space-y-2">
          <Label htmlFor="registration_url">Website Registration URL *</Label>
          <Input
            {...register('registration_url')}
            id="registration_url"
            type="text"
            placeholder="https://example.com/register"
            disabled={isViewingLeague}
            aria-invalid={displayErrors.registration_url ? 'true' : 'false'}
          />
          {displayErrors.registration_url && (
            <p className="text-sm text-red-600">{displayErrors.registration_url.message}</p>
          )}
        </div>
      </div>

      {/* Hidden sport_id field */}
      <input type="hidden" {...register('sport_id')} />
    </div>
  )
}
