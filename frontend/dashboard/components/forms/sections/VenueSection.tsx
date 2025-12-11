'use client'

import { useFormContext } from 'react-hook-form'
import { useRef } from 'react'
import { X } from 'lucide-react'
import { VenueAutocomplete } from '../VenueAutocomplete'
import { MapboxAddressInput } from '../MapboxAddressInput'
import { type AddLeagueFormData } from '@/lib/schemas'

interface Venue {
  id: number
  name: string
  address: string
  lat: number
  lng: number
  status: 'approved' | 'pending' | 'rejected'
  request_count: number
}

interface VenueSectionProps {
  selectedVenue: Venue | null
  venueSearchInput: string
  showNewVenueForm: boolean
  onVenueChange: (venue: Venue | null) => void
  onVenueSearchChange: (input: string) => void
  onVenueAddressChange: (featureCollection: any) => void
  onShowNewVenueFormChange: (show: boolean) => void
  onMapboxDropdownStateChange?: (isOpen: boolean) => void
  isViewingLeague?: boolean
}

export function VenueSection({
  selectedVenue,
  venueSearchInput,
  showNewVenueForm,
  onVenueChange,
  onVenueSearchChange,
  onVenueAddressChange,
  onShowNewVenueFormChange,
  onMapboxDropdownStateChange,
  isViewingLeague = false,
}: VenueSectionProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<AddLeagueFormData>()

  const displayErrors = errors
  const newVenueAddressInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Venue</h3>
          <p className="text-sm text-gray-600">Choose where your league will be played.</p>
        </div>
        {!showNewVenueForm && (
          <button
            type="button"
            onClick={() => {
              // Clear any previously selected venue
              onVenueChange(null)
              onVenueSearchChange('')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue('venue_id', null as any)
              setValue('venue_name', '')
              setValue('venue_address', '')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue('venue_lat', null as any)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue('venue_lng', null as any)
              // Show the new venue form
              onShowNewVenueFormChange(true)
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            + Add New Venue
          </button>
        )}
      </div>

      {!showNewVenueForm ? (
        // Show only venue autocomplete
        <VenueAutocomplete
          selectedVenue={selectedVenue}
          venueSearchInput={venueSearchInput}
          onVenueChange={(venue) => {
            onVenueChange(venue)
            if (venue) {
              setValue('venue_id', venue.id)
              setValue('venue_name', venue.name)
              setValue('venue_address', venue.address)
              setValue('venue_lat', venue.lat)
              setValue('venue_lng', venue.lng)
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue('venue_id', null as any)
              setValue('venue_name', '')
              setValue('venue_address', '')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue('venue_lat', null as any)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue('venue_lng', null as any)
            }
          }}
          onVenueSearchChange={onVenueSearchChange}
          onVenueAddressChange={onVenueAddressChange}
          onMapboxDropdownStateChange={onMapboxDropdownStateChange}
          venueError={displayErrors.venue_name?.message || displayErrors.venue_address?.message || displayErrors.venue_lat?.message || displayErrors.venue_lng?.message}
          isViewingLeague={isViewingLeague}
          customVenueAddress={watch('venue_address') || undefined}
          hideAddressInput={true}
        />
      ) : (
        // Show new venue flow
        <div className="space-y-4">
          <div className="space-y-3">
            <label htmlFor="venue_name_new" className="text-sm font-medium text-gray-700">
              Venue Name  *
            </label>
            <input
              type="text"
              id="venue_name_new"
              placeholder="e.g., Central Sports Complex"
              disabled={isViewingLeague}
              aria-invalid={displayErrors.venue_name ? 'true' : 'false'}
              value={watch('venue_name') || ''}
              onChange={(e) => setValue('venue_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                displayErrors.venue_name ? 'border-red-500 border-2' : 'border-gray-300'
              }`}
            />
            {displayErrors.venue_name && (
              <p className="text-sm text-red-600">{displayErrors.venue_name.message}</p>
            )}
          </div>


          <div className="space-y-2">
            <label htmlFor="new_venue_address" className="text-sm font-medium text-gray-700">
              Venue Address *
            </label>
            <p className="text-sm text-gray-600">Find address or enter custom location</p>
            <MapboxAddressInput
              ref={newVenueAddressInputRef}
              id="new_venue_address"
              placeholder="Search address..."
              onRetrieve={onVenueAddressChange}
              onMapboxDropdownStateChange={onMapboxDropdownStateChange}
              hasError={!!(displayErrors.venue_address || displayErrors.venue_lat || displayErrors.venue_lng)}
            />
            {(displayErrors.venue_address || displayErrors.venue_lat || displayErrors.venue_lng) && (
              <p className="text-sm text-red-600">
                {displayErrors.venue_address?.message || displayErrors.venue_lat?.message || displayErrors.venue_lng?.message}
              </p>
            )}
          </div>


          {/* Display selected address from Mapbox */}
          {watch('venue_address') && (
            <div className="flex items-start justify-between bg-green-50 p-3 rounded-md border border-green-200">
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium">{watch('venue_name') || 'New Venue'}</p>
                <p className="text-xs text-green-600 whitespace-normal break-words">{watch('venue_address')}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValue('venue_name', '')
                  setValue('venue_address', '')
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setValue('venue_lat', null as any)
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setValue('venue_lng', null as any)
                  if (newVenueAddressInputRef.current) {
                    newVenueAddressInputRef.current.value = ''
                  }
                }}
                className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">This venue will be reviewed to help ensure location accuracy.</p>
            <button
              type="button"
              onClick={() => {
                setValue('venue_name', '')
                setValue('venue_address', '')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setValue('venue_lat', null as any)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setValue('venue_lng', null as any)
                if (newVenueAddressInputRef.current) {
                  newVenueAddressInputRef.current.value = ''
                }
                onShowNewVenueFormChange(false)
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden venue fields */}
      <input type="hidden" {...register('venue_id')} />
      <input type="hidden" {...register('venue_name')} />
      <input type="hidden" {...register('venue_address')} />
      <input type="hidden" {...register('venue_lat')} />
      <input type="hidden" {...register('venue_lng')} />
    </div>
  )
}
