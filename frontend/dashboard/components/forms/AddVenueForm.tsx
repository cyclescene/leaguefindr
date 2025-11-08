'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addVenueSchema, type AddVenueFormData } from '@/lib/schemas'
import { useAuth } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Dynamically import AddressAutofill to avoid SSR issues
const AddressAutofill = dynamic(
  () => import('@mapbox/search-js-react').then(mod => mod.AddressAutofill),
  { ssr: false }
) as any

interface AddVenueFormProps {
  onSuccess?: () => void
  onClose?: () => void
  onMapboxDropdownStateChange?: (isOpen: boolean) => void
}

export function AddVenueForm({ onSuccess, onClose, onMapboxDropdownStateChange }: AddVenueFormProps) {
  const { getToken, userId } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<AddVenueFormData>({
    resolver: zodResolver(addVenueSchema),
    defaultValues: {
      name: '',
      address: '',
      lat: 0,
      lng: 0
    }
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)

  // Handle address selection from Mapbox AddressAutofill
  const handleAddressChange = (featureCollection: any) => {
    // Extract the first feature from the FeatureCollection
    const feature = featureCollection?.features?.[0]

    if (feature && feature.geometry && feature.properties) {
      const [lng, lat] = feature.geometry.coordinates
      const address = feature.properties.full_address || feature.properties.place_name

      // Update form with selected address and coordinates
      setValue('address', address)
      setValue('lat', lat)
      setValue('lng', lng)

      setSelectedLocation({
        address,
        lat,
        lng
      })
    }
  }

  // Handle form submission
  const onSubmit = async (data: AddVenueFormData) => {
    setSubmitError(null)

    try {
      const token = await getToken()

      if (!token || !userId) {
        throw new Error('Authentication required. Please sign in.')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/venues`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Clerk-User-ID': userId,
          },
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create venue')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose?.()
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit venue'
      setSubmitError(message)
      console.error('Submit error:', error)
    }
  }

  if (success) {
    return (
      <div className="px-6 py-4 text-center">
        <p className="text-green-600 font-medium">Venue submitted successfully! It will be reviewed by an admin.</p>
      </div>
    )
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onClick={(e) => e.stopPropagation()}
      className="space-y-6 px-6 py-4"
    >
      {/* Venue Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Venue Name</Label>
        <Input
          {...register('name')}
          id="name"
          type="text"
          placeholder="e.g., Downtown Sports Complex"
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Address with Mapbox Autofill */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        {mapboxToken ? (
          <AddressAutofill accessToken={mapboxToken} onRetrieve={handleAddressChange}>
            <Input
              {...register('address')}
              ref={addressInputRef}
              id="address"
              type="text"
              autoComplete="address-line1"
              placeholder="Search for an address..."
              aria-invalid={errors.address ? 'true' : 'false'}
              onFocus={() => onMapboxDropdownStateChange?.(true)}
              onBlur={() => onMapboxDropdownStateChange?.(false)}
            />
          </AddressAutofill>
        ) : (
          <Input
            {...register('address')}
            ref={addressInputRef}
            id="address"
            type="text"
            placeholder="Search for an address..."
            aria-invalid={errors.address ? 'true' : 'false'}
          />
        )}

        {errors.address && (
          <p className="text-sm text-red-600">{errors.address.message}</p>
        )}

        {selectedLocation && (
          <p className="text-sm text-green-600">
            ✓ Location selected: {selectedLocation.address}
          </p>
        )}
      </div>

      {/* Hidden fields for coordinates set by Mapbox */}
      <input {...register('lat')} type="hidden" />
      <input {...register('lng')} type="hidden" />

      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-brand-dark px-4 py-2 text-white font-medium hover:bg-brand-dark/90 disabled:bg-neutral-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Venue'}
      </button>

      <p className="text-xs text-gray-500">
        Your venue submission will be reviewed by an admin before appearing on the map.
      </p>
    </form>
  )
}
