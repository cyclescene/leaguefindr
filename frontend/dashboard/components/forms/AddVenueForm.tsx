'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addVenueSchema, type AddVenueFormData } from '@/lib/schemas'
import { useAuth } from '@clerk/nextjs'
import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapboxAddressInput } from './MapboxAddressInput'

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

  // Monitor Mapbox AddressAutofill dropdown and stop event propagation for clicks on it
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout
    let lastEventTime = 0
    const debounceDelay = 50 // 50ms debounce to prevent excessive event handling

    const handlePointerDown = (e: PointerEvent) => {
      // Check if the click is on a Mapbox element (suggestions, dropdown items, etc)
      const target = e.target as HTMLElement
      const isMapboxElement = target.closest(
        '[class*="mapbox"], [class*="search"], [role="option"], [class*="suggestions"], [class*="suggestion"]'
      )

      if (isMapboxElement) {
        const now = Date.now()
        if (now - lastEventTime < debounceDelay) {
          return // Skip if too soon
        }
        lastEventTime = now

        // Mark that Mapbox dropdown is open
        onMapboxDropdownStateChange?.(true)

        // Stop the event from propagating to the dialog
        e.stopPropagation()
        e.preventDefault()
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      // Also stop propagation for pointer up events on Mapbox elements
      const target = e.target as HTMLElement
      const isMapboxElement = target.closest(
        '[class*="mapbox"], [class*="search"], [role="option"], [class*="suggestions"], [class*="suggestion"]'
      )

      if (isMapboxElement) {
        const now = Date.now()
        if (now - lastEventTime < debounceDelay) {
          return // Skip if too soon
        }
        lastEventTime = now

        e.stopPropagation()
        e.preventDefault()
      }

      // Debounce the close check
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const mapboxSuggestions = document.querySelector('[class*="suggestions"]')
        if (!mapboxSuggestions || window.getComputedStyle(mapboxSuggestions).display === 'none') {
          onMapboxDropdownStateChange?.(false)
        }
      }, 100)
    }

    // Use capture phase to intercept events before they bubble up
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('pointerup', handlePointerUp, true)

    return () => {
      clearTimeout(debounceTimer)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('pointerup', handlePointerUp, true)
    }
  }, [onMapboxDropdownStateChange])

  // Handle address selection from Mapbox AddressAutofill
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        let errorMessage = 'Failed to create venue'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If JSON parsing fails, try to get plain text
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onClick={(e) => e.stopPropagation()}
      className="space-y-6 px-6 py-4"
    >
      {/* Venue Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Venue Name *</Label>
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
        <Label htmlFor="address">Address *</Label>
        <MapboxAddressInput
          ref={addressInputRef}
          id="address"
          placeholder="Search for an address..."
          onRetrieve={handleAddressChange}
          onMapboxDropdownStateChange={onMapboxDropdownStateChange}
        />

        {errors.address && (
          <p className="text-sm text-red-600">{errors.address.message}</p>
        )}

        {!selectedLocation && !errors.address && (
          <p className="text-xs text-gray-600">
            Type and select an address from the dropdown to set the venue location.
          </p>
        )}

        {selectedLocation && (
          <p className="text-sm text-green-600 mt-2">
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
    </form>
  )
}
