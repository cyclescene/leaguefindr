'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type AddLeagueFormData } from '@/lib/schemas'

interface PricingSectionProps {
  isViewingLeague?: boolean
}

export function PricingSection({ isViewingLeague = false }: PricingSectionProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<AddLeagueFormData>()

  const displayErrors = errors
  const pricingStrategy = watch('pricing_strategy')
  const pricingAmount = watch('pricing_amount')
  const minimumPlayers = watch('minimum_team_players')

  // Calculate per-player price
  const calculatePerPlayerPrice = () => {
    if (!pricingAmount || !minimumPlayers) return null
    if (pricingStrategy === 'per_person') return pricingAmount
    if (pricingStrategy === 'per_team') {
      return Math.ceil(pricingAmount / minimumPlayers)
    }
    return null
  }

  const perPlayerPrice = calculatePerPlayerPrice()

  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Pricing</h3>
      <p className="text-sm text-gray-600 mb-4">TBD</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Pricing Strategy */}
        <div className="space-y-2">
          <Label htmlFor="pricing_strategy">Pricing Strategy *</Label>
          <select
            {...register('pricing_strategy')}
            id="pricing_strategy"
            disabled={isViewingLeague}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
            aria-invalid={displayErrors.pricing_strategy ? 'true' : 'false'}
          >
            <option value="per_person">Per Person</option>
            <option value="per_team">Per Team</option>
          </select>
          {displayErrors.pricing_strategy && (
            <p className="text-sm text-red-600">{displayErrors.pricing_strategy.message}</p>
          )}
        </div>

        {/* Pricing Amount */}
        <div className="space-y-2">
          <Label htmlFor="pricing_amount">
            {pricingStrategy === 'per_team' ? 'Team Cost ($)' : 'Cost Per Person ($)'} *
          </Label>
          <Input
            {...register('pricing_amount', { valueAsNumber: true })}
            id="pricing_amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            disabled={isViewingLeague}
            aria-invalid={displayErrors.pricing_amount ? 'true' : 'false'}
            onWheel={(e) => e.currentTarget.blur()}
          />
          {displayErrors.pricing_amount && (
            <p className="text-sm text-red-600">{displayErrors.pricing_amount.message}</p>
          )}
        </div>
      </div>

      {/* Per Game Fee */}
      <div className="space-y-2 mb-6">
        <Label htmlFor="per_game_fee">Per Game Team Fee (Optional)</Label>
        <p className="text-sm text-gray-600">Additional team fee per game for referee, equipment, etc</p>
        <Input
          {...register('per_game_fee')}
          id="per_game_fee"
          type="number"
          step="0.01"
          placeholder="0.00"
          disabled={isViewingLeague}
          aria-invalid={displayErrors.per_game_fee ? 'true' : 'false'}
          onWheel={(e) => e.currentTarget.blur()}
        />
        {displayErrors.per_game_fee && (
          <p className="text-sm text-red-600">{displayErrors.per_game_fee.message}</p>
        )}
      </div>

      {/* Price Preview */}
      {perPlayerPrice !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Estimated price per player:</span>{' '}
            <span className="text-lg font-bold text-blue-600">${perPlayerPrice.toFixed(2)}</span>
          </p>
          {pricingStrategy === 'per_team' && (
            <p className="text-xs text-gray-600 mt-1">
              (Calculated by dividing team cost by {minimumPlayers} players)
            </p>
          )}
        </div>
      )}
    </div>
  )
}
