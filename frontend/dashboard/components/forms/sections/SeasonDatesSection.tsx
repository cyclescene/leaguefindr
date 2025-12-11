'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { type AddLeagueFormData } from '@/lib/schemas'

interface SeasonDatesSectionProps {
  registrationDeadline?: Date
  seasonStartDate?: Date
  seasonEndDate?: Date
  onRegistrationDeadlineChange: (date: Date | undefined) => void
  onSeasonStartDateChange: (date: Date | undefined) => void
  onSeasonEndDateChange: (date: Date | undefined) => void
  isViewingLeague?: boolean
}

export function SeasonDatesSection({
  registrationDeadline,
  seasonStartDate,
  seasonEndDate,
  onRegistrationDeadlineChange,
  onSeasonStartDateChange,
  onSeasonEndDateChange,
  isViewingLeague = false,
}: SeasonDatesSectionProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AddLeagueFormData>()

  const displayErrors = errors

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Season Dates</h3>
      <p className="text-sm text-gray-600 mb-4">Choose when your season starts and ends</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Registration Deadline */}
        <div className="space-y-2">
          <Label htmlFor="registration_deadline">Registration Deadline *</Label>
          <DatePicker
            date={registrationDeadline}
            onDateChange={onRegistrationDeadlineChange}
            placeholder="Select deadline"
            disabled={isViewingLeague}
            hasError={!!displayErrors.registration_deadline}
          />
          {displayErrors.registration_deadline && (
            <p className="text-sm text-red-600">{displayErrors.registration_deadline.message}</p>
          )}
        </div>

        {/* Season Start Date */}
        <div className="space-y-2">
          <Label htmlFor="season_start_date">Season Start Date *</Label>
          <DatePicker
            date={seasonStartDate}
            onDateChange={onSeasonStartDateChange}
            placeholder="Select start date"
            disabled={isViewingLeague}
            hasError={!!displayErrors.season_start_date}
          />
          {displayErrors.season_start_date && (
            <p className="text-sm text-red-600">{displayErrors.season_start_date.message}</p>
          )}
        </div>

        {/* Season End Date */}
        <div className="space-y-2">
          <Label htmlFor="season_end_date">Season End Date (Optional)</Label>
          <DatePicker
            date={seasonEndDate}
            onDateChange={onSeasonEndDateChange}
            placeholder="Select end date"
            disabled={isViewingLeague}
            hasError={!!displayErrors.season_end_date}
          />
          {displayErrors.season_end_date && (
            <p className="text-sm text-red-600">{displayErrors.season_end_date.message}</p>
          )}
        </div>

        {/* Number of Games */}
        <div className="space-y-2">
          <Label htmlFor="duration">Number of Games *</Label>
          <Input
            {...register('duration', { valueAsNumber: true })}
            id="duration"
            type="number"
            placeholder="8"
            disabled={isViewingLeague}
            aria-invalid={displayErrors.duration ? 'true' : 'false'}
            onWheel={(e) => e.currentTarget.blur()}
          />
          {displayErrors.duration && (
            <p className="text-sm text-red-600">{displayErrors.duration.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
