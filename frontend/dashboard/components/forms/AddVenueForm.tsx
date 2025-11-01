'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addVenueSchema, type AddVenueFormData } from '@/lib/schemas'
import { useState, useRef, useEffect } from 'react'

interface MapboxResult {
  id: string
  full_address: string
  geometry: {
    coordinates: [number, number] // [longitude, latitude]
  }
}

interface MapboxSuggestion {
  id: string
  full_address: string
  place_name: string
  geometry: {
    coordinates: [number, number]
  }
}

interface MapboxRetrieveResult {
  properties: {
    full_address: string
  }
  geometry: {
    coordinates: [number, number]
  }
}

export function AddVenueForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<AddVenueFormData>({
    resolver: zodResolver(addVenueSchema),
    defaultValues: {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0
    }
  })

  const [addressSuggestions, setAddressSuggestions] = useState<MapboxSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<MapboxRetrieveResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const addressValue = watch('address')

  // Mapbox autocomplete search
  const handleAddressSearch = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (!token) {
        console.error('Mapbox token not configured')
        return
      }

      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${token}`
      )

      if (!response.ok) throw new Error('Failed to fetch suggestions')

      const data = await response.json()
      setAddressSuggestions(data.suggestions || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Address search error:', error)
      setAddressSuggestions([])
    }
  }

  // Handle address selection
  const handleSelectAddress = async (suggestion: MapboxSuggestion) => {
    // Get full details with coordinates
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    if (!token) {
      console.error('Mapbox token not configured')
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(suggestion.id)}?access_token=${token}`
      )

      if (!response.ok) throw new Error('Failed to retrieve address details')

      const data = await response.json()
      const result = data.features[0]

      // Update form with address and coordinates
      setValue('address', result.properties.full_address)
      setValue('latitude', result.geometry.coordinates[1]) // latitude is second
      setValue('longitude', result.geometry.coordinates[0]) // longitude is first

      setSelectedAddress(result)
      setShowSuggestions(false)
      setAddressSuggestions([])
    } catch (error) {
      console.error('Failed to retrieve address details:', error)
    }
  }

  // Handle form submission
  const onSubmit = async (data: AddVenueFormData) => {
    setSubmitError(null)

    try {
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create venue')
      }

      const result = await response.json()
      alert('Venue submitted successfully! It will be reviewed by an admin.')

      // Reset form
      setValue('name', '')
      setValue('address', '')
      setValue('latitude', 0)
      setValue('longitude', 0)
      setSelectedAddress(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit venue'
      setSubmitError(message)
      console.error('Submit error:', error)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        if (addressInputRef.current && !addressInputRef.current.contains(event.target as Node)) {
          setShowSuggestions(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Venue Name
        </label>
        <input
          {...register('name')}
          type="text"
          placeholder="e.g., Downtown Sports Complex"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="relative">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          {...register('address')}
          ref={addressInputRef}
          type="text"
          placeholder="Search for an address..."
          onChange={(e) => handleAddressSearch(e.target.value)}
          onFocus={() => {
            if (addressValue && addressValue.length >= 3) {
              setShowSuggestions(true)
            }
          }}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Address suggestions dropdown */}
        {showSuggestions && addressSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10"
          >
            {addressSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelectAddress(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
              >
                <p className="text-sm font-medium text-gray-900">{suggestion.full_address}</p>
                <p className="text-xs text-gray-500">{suggestion.place_name}</p>
              </button>
            ))}
          </div>
        )}

        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}

        {selectedAddress && (
          <p className="mt-1 text-sm text-green-600">
             Location selected: {selectedAddress.properties.full_address}
          </p>
        )}
      </div>

      {/* Hidden fields for coordinates set by Mapbox */}
      <input {...register('latitude')} type="hidden" />
      <input {...register('longitude')} type="hidden" />

      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Venue'}
      </button>

      <p className="text-xs text-gray-500">
        Your venue submission will be reviewed by an admin before appearing on the map.
      </p>
    </form>
  )
}
