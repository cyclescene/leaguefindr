'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { type AddLeagueFormData } from '@/lib/schemas'

interface AdditionalInformationSectionProps {
  isViewingLeague?: boolean
}

export function AdditionalInformationSection({ isViewingLeague = false }: AdditionalInformationSectionProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<AddLeagueFormData>()

  const displayErrors = errors

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Additional Information</h3>
      <p className="text-sm text-gray-600 mb-4">TBD</p>

      <div className="space-y-2">
        <Label htmlFor="season_details">Season Details (Optional)</Label>
        <textarea
          {...register('season_details')}
          id="season_details"
          placeholder="TBD"
          disabled={isViewingLeague}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-500"
          rows={3}
          aria-invalid={displayErrors.season_details ? 'true' : 'false'}
        />
        {displayErrors.season_details && (
          <p className="text-sm text-red-600">{displayErrors.season_details.message}</p>
        )}
      </div>
    </div>
  )
}
