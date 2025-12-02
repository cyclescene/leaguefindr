'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { Container } from '@/components/ui'
import { useRouter } from 'next/navigation'
import { useGeolocation } from '@/lib/hooks'
import { geocodeAddress, reverseGeocode } from '@/lib/services/geocoding'
import { Analytics } from '@/lib/analytics'
import { shortenLocationName } from '@/lib/utils'

export function HeroSection() {
  const [searchValue, setSearchValue] = useState('')
  const [isUsingLocation, setIsUsingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false)
  const router = useRouter()
  const { latitude, longitude, error: geoError, loading: geoLoading, getCurrentLocation } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 300000 // 5 minutes
  })

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
        // Navigate with coordinates from geocoding (no query parameter for location search)
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

  // Update search value when using location
  useEffect(() => {
    if (isUsingLocation && !geoLoading && latitude && longitude) {
      setSearchValue('Using your current location...')
    } else if (!isUsingLocation) {
      setSearchValue('')
    }
  }, [isUsingLocation, geoLoading, latitude, longitude])

  // Handle geolocation errors and track location services
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



  // Handle form submission
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    // Track search event
    if (searchValue.trim()) {
      Analytics.usedSearchHomepage(searchValue.trim())
    }
    
    if (isUsingLocation) {
      handleLocationSearch()
    } else {
      handleTextSearch(searchValue)
    }
  }

  // Handle "Use My Location" button
  const handleUseLocation = () => {
    setLocationError(null)
    setIsUsingLocation(true)
    
    // Always trigger location request when user clicks the button
    getCurrentLocation()
  }

  const canSearch = isUsingLocation 
    ? latitude && longitude && !geoLoading 
    : searchValue.trim().length > 0

  const isLoading = (isUsingLocation && geoLoading) || isGeocodingLocation

  return (
    <section className="relative min-h-[70vh] lg:min-h-screen lg:flex lg:items-center bg-gradient-to-br from-off-white to-gray-1">
      {/* Mobile Background Image with Overlay */}
      <div className="absolute inset-0 lg:hidden">
        <Image 
          src="/images/hero-mobile-background.jpg" 
          alt="Sports background" 
          fill
          sizes="100vw"
          className="object-cover object-center" 
          priority
          quality={90}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAVGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        {/* Washed Away Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-off-white/85 via-off-white/70 to-off-white/85"></div>
      </div>
      
      <Container className="relative z-10 pt-20 pb-6 lg:py-0">
        <div className="grid lg:grid-cols-12 gap-6 lg:items-center">
          {/* Left Content - Takes 5/12 of space to give more room to image */}
          <div className="lg:col-span-5">
            <div className="animate-fade-in">
              {/* Main Headline */}

              <div className="space-y-6 mb-8 lg:mb-12">
                <h1 className="leading-tight text-[2.2rem] sm:text-[2.8rem] lg:text-[3.5rem] lg:whitespace-nowrap">
                  Find Your Game
                </h1>
                <h3 className="max-w-md">
                  Discover, explore and play in sports leagues near you.
                </h3>
              </div>

              {/* Hero Search */}
              <div className="mb-6 lg:mb-8 space-y-4">
                <form 
                  onSubmit={handleSearch} 
                  className="max-w-sm relative group" 
                  role="search"
                >
                  <label htmlFor="hero-search" className="sr-only">
                    Search for City or ZIP Code to find sports leagues in your area
                  </label>
                  <div className="relative">
                    <input
                      id="hero-search"
                      type="text"
                      placeholder={isUsingLocation ? "Getting your location..." : "City or ZIP Code"}
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value)
                        setIsUsingLocation(false)
                      }}
                      disabled={isUsingLocation}
                      className={`form-input w-full px-6 py-4 pl-14 pr-20 sm:pr-24 text-lg rounded-lg border-2 text-gray-5 shadow-lg focus:border-dark-green focus:ring-2 focus:ring-dark-green/20 transition-all duration-300 ease-out font-montserrat ${
                        isUsingLocation 
                          ? 'border-light-green bg-light-green/5 cursor-not-allowed' 
                          : 'border-gray-3'
                      }`}
                    />
                    {isUsingLocation ? (
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-light-green" aria-hidden="true" />
                    ) : (
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-4 transition-colors duration-300 group-focus-within:text-dark-green" aria-hidden="true" />
                    )}
                    <button
                      type="submit"
                      disabled={!canSearch || isLoading}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-2 sm:px-3 sm:py-2 rounded font-montserrat font-bold uppercase transition-all duration-300 text-xs flex items-center gap-1 bg-dark-green text-white hover:bg-dark-green/90 hover:scale-105 focus:scale-105"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="hidden lg:inline">Finding...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Find A League</span>
                          <span className="sm:hidden">Find</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Use My Location Button */}
                {!isUsingLocation && (
                  <div className="max-w-sm">
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={geoLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-3 rounded-lg font-montserrat font-semibold text-gray-5 hover:border-light-green hover:text-light-green transition-all duration-300 group"
                    >
                      {geoLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 group-hover:text-light-green transition-colors" />
                          Use My Location
                        </>
                      )}
                    </button>
                    
                    {/* Location Error */}
                    {(locationError || geoError) && (
                      <p className="mt-2 text-sm text-red-600 text-center">
                        {locationError || geoError}
                      </p>
                    )}
                  </div>
                )}

                {/* Clear Location Button */}
                {isUsingLocation && (
                  <div className="max-w-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUsingLocation(false)
                        setSearchValue('')
                        setLocationError(null)
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-montserrat font-medium text-gray-5 hover:text-dark-green transition-colors"
                    >
                      Cancel location search
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Image - Takes 7/12 of space for bigger image */}
          <div className="hidden lg:block lg:col-span-7">
            <div className="relative h-[600px] w-full rounded-lg overflow-hidden shadow-lg">
              <Image 
                src="/images/hero-volleyball.jpg" 
                alt="Volleyball players in action" 
                fill
                sizes="60vw"
                className="object-cover object-left" 
                priority
                quality={90}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAVGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
} 