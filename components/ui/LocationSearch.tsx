'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Loader2, X } from 'lucide-react'
import { useGeolocation } from '@/lib/hooks'
import { geocodeAddress, reverseGeocode } from '@/lib/services/geocoding'
import { Analytics } from '@/lib/analytics'
import { cn, shortenLocationName } from '@/lib/utils'

interface LocationSearchProps {
  className?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'hero'
  analyticsSource?: 'homepage' | 'navigation' | 'find-league'
  onSearch?: () => void // Callback for when search is initiated
}

export function LocationSearch({ 
  className = '', 
  placeholder = "City or ZIP Code",
  size = 'md',
  variant = 'default',
  analyticsSource = 'find-league',
  onSearch
}: LocationSearchProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isUsingLocation, setIsUsingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false)
  
  const { loading: geoLoading, latitude, longitude, error: geoError, getCurrentLocation } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 300000 // 5 minutes
  })

  // Update search value when using location
  useEffect(() => {
    if (isUsingLocation && !geoLoading && latitude && longitude) {
      setSearchValue('Using your current location...')
    } else if (!isUsingLocation) {
      setSearchValue('')
    }
  }, [isUsingLocation, geoLoading, latitude, longitude])

  // Handle geolocation errors
  useEffect(() => {
    if (isUsingLocation && geoError) {
      setLocationError(geoError)
      setIsUsingLocation(false)
      
      // Track location services denied
      if (geoError.toLowerCase().includes('denied') || geoError.toLowerCase().includes('permission')) {
        Analytics.declinedLocationServices()
      }
    }
  }, [geoError, isUsingLocation])

  // Track successful location access
  useEffect(() => {
    if (isUsingLocation && latitude && longitude && !geoLoading) {
      Analytics.allowedLocationServices()
    }
  }, [isUsingLocation, latitude, longitude, geoLoading])

  // Handle location-based search
  const handleLocationSearch = async () => {
    if (latitude && longitude) {
      try {
        setIsGeocodingLocation(true)
        
        // Try to get a readable location name
        const reverseResult = await reverseGeocode(latitude, longitude)
        let locationName = 'Your Location'
        
        if (reverseResult.success && reverseResult.result) {
          const { city, state } = reverseResult.result
          if (city && state) {
            locationName = `${city}, ${state}`
          } else if (city) {
            locationName = city
          }
        }
        
        // Navigate with location coordinates
        const params = new URLSearchParams({
          location: `${latitude},${longitude}`,
          radius: '35',
          locationName: shortenLocationName(locationName)
        })
        
        router.push(`/find-a-league?${params.toString()}`)
        
      } catch (error) {
        setLocationError('Failed to process your location')
      } finally {
        setIsGeocodingLocation(false)
      }
    }
  }

  // Handle text-based search (city/ZIP)
  const handleTextSearch = async (searchValue: string) => {
    const trimmedValue = searchValue.trim()
    if (!trimmedValue) return

    try {
      setIsGeocodingLocation(true)
      
      // Try geocoding the search term
      const geocodeResult = await geocodeAddress(trimmedValue)
      
      if (geocodeResult.success && geocodeResult.result) {
        // Navigate with coordinates from geocoding
        const params = new URLSearchParams({
          location: `${geocodeResult.result.lat},${geocodeResult.result.lng}`,
          radius: '35',
          locationName: shortenLocationName(geocodeResult.result.displayName)
        })
        
        router.push(`/find-a-league?${params.toString()}`)
      } else {
        // Fallback to text-only search
        router.push(`/find-a-league?query=${encodeURIComponent(trimmedValue)}`)
      }
      
    } catch (error) {
      // Fallback to text-only search
      router.push(`/find-a-league?query=${encodeURIComponent(trimmedValue)}`)
    } finally {
      setIsGeocodingLocation(false)
    }
  }

  // Handle "Use My Location" button
  const handleUseLocation = () => {
    setLocationError(null)
    setIsUsingLocation(true)
    
    // Always trigger location request when user clicks the button
    getCurrentLocation()
  }

  // Handle form submission
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    // Track search event based on source
    if (searchValue.trim()) {
      switch (analyticsSource) {
        case 'homepage':
          Analytics.usedSearchHomepage(searchValue.trim())
          break
        case 'navigation':
          Analytics.usedSearchNavigation(searchValue.trim())
          break
        case 'find-league':
          // Add new analytics event for find-league search if needed
          Analytics.usedSearchNavigation(searchValue.trim()) // Fallback to navigation for now
          break
      }
    }
    
    // Call onSearch callback if provided
    onSearch?.()
    
    if (isUsingLocation) {
      handleLocationSearch()
    } else {
      handleTextSearch(searchValue)
    }
  }

  const canSearch = isUsingLocation 
    ? latitude && longitude && !geoLoading 
    : searchValue.trim().length > 0

  const isLoading = (isUsingLocation && geoLoading) || isGeocodingLocation

  // Size variants
  const sizeClasses = {
    sm: {
      input: 'px-3 py-2 pl-9 pr-16 text-sm',
      icon: 'w-4 h-4',
      button: 'px-2 py-1 text-xs',
      locationButton: 'p-1'
    },
    md: {
      input: 'px-4 py-2 pl-10 pr-20 text-base',
      icon: 'w-4 h-4',
      button: 'px-3 py-1 text-xs',
      locationButton: 'p-1'
    },
    lg: {
      input: 'px-6 py-4 pl-14 pr-24 text-lg',
      icon: 'w-6 h-6',
      button: 'px-4 py-2 text-sm',
      locationButton: 'p-2'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={className}>
      <form 
        onSubmit={handleSearch} 
        className="w-full relative group" 
        role="search"
      >
        <label htmlFor="location-search" className="sr-only">
          Search for sports leagues by city or ZIP code
        </label>
        <div className="relative">
          <input
            id="location-search"
            type="text"
            placeholder={isUsingLocation ? "Getting your location..." : placeholder}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              setIsUsingLocation(false)
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            disabled={isUsingLocation}
            className={cn(
              "form-input w-full rounded-lg border text-gray-5 transition-all duration-300 font-montserrat",
              currentSize.input,
              variant === 'hero' 
                ? "border-2 shadow-lg focus:border-dark-green focus:ring-2 focus:ring-dark-green/20" 
                : "focus:border-light-green focus:ring-2 focus:ring-light-green/20 border-gray-3",
              isUsingLocation 
                ? 'border-light-green bg-light-green/5 cursor-not-allowed' 
                : ''
            )}
          />
          
          {/* Icon */}
          {isUsingLocation ? (
            <MapPin className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 text-light-green", currentSize.icon)} aria-hidden="true" />
          ) : (
            <Search className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-4 transition-colors duration-300",
              currentSize.icon,
              isSearchFocused && "text-light-green"
            )} aria-hidden="true" />
          )}
          
          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <button
              type="submit"
              disabled={!canSearch || isLoading}
              className={cn(
                "rounded font-montserrat font-bold uppercase transition-all duration-300 flex items-center gap-1 bg-dark-green text-white hover:bg-dark-green/90",
                currentSize.button
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Finding...</span>
                </>
              ) : (
                <>
                  <span className={size === 'lg' ? 'hidden sm:inline' : ''}>
                    {size === 'lg' ? 'Find A League' : 'Search'}
                  </span>
                  {size === 'lg' && <span className="sm:hidden">Find</span>}
                </>
              )}
            </button>
            
            {/* Location Button */}
            {!isUsingLocation ? (
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={geoLoading}
                className={cn(
                  "rounded hover:bg-white/10 transition-colors duration-300 group",
                  currentSize.locationButton
                )}
                title="Use my location"
              >
                {geoLoading ? (
                  <Loader2 className={cn("animate-spin text-light-green", currentSize.icon)} />
                ) : (
                  <MapPin className={cn("text-light-green hover:text-yellow-300 transition-colors", currentSize.icon)} />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsUsingLocation(false)
                  setSearchValue('')
                  setLocationError(null)
                }}
                className={cn(
                  "rounded hover:bg-white/10 transition-colors duration-300 group",
                  currentSize.locationButton
                )}
                title="Cancel location search"
              >
                <X className={cn("text-white/70 group-hover:text-red-400 transition-colors", currentSize.icon)} />
              </button>
            )}
          </div>
        </div>
      </form>
      
      {/* Error Display */}
      {(locationError || geoError) && (
        <p className="mt-2 text-sm text-red-500 text-center">
          {locationError || geoError}
        </p>
      )}
    </div>
  )
} 