'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Menu, X, MapPin, Loader2 } from 'lucide-react'
import { Container } from '@/components/ui'
import { NAV_LINKS, MOBILE_NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useGeolocation } from '@/lib/hooks'
import { geocodeAddress, reverseGeocode } from '@/lib/services/geocoding'
import { Analytics } from '@/lib/analytics'
import { shortenLocationName } from '@/lib/utils'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isUsingLocation, setIsUsingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false)
  const router = useRouter()
  const { latitude, longitude, error: geoError, loading: geoLoading, getCurrentLocation } = useGeolocation({
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
    }
  }, [geoError, isUsingLocation])

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
    
    // Track search event
    if (searchValue.trim()) {
      Analytics.usedSearchNavigation(searchValue.trim())
    }
    
    // Close mobile menu after search
    setIsMobileMenuOpen(false)
    
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

  const toggleMobileMenu = () => {
    if (!isMobileMenuOpen) {
      Analytics.clickedHamburgerMenu()
    }
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Use overflow hidden instead of position fixed to avoid sticky conflicts
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      return () => {
        // Restore original overflow
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* Main Navbar - Always sticky */}
      <nav className="sticky top-0 z-50 bg-dark-green text-white shadow-lg">
        <Container>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity duration-300"
            >
              <Image
                src="/images/logo.png"
                alt="LeagueFindr"
                width={80}
                height={24}
                sizes="80px"
                className="h-6 w-auto object-contain"
                priority
                quality={95}
              />
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form 
                onSubmit={handleSearch} 
                className="w-full relative group" 
                role="search"
              >
                <label htmlFor="nav-search" className="sr-only">
                  Search for sports leagues by city or ZIP code
                </label>
                <input
                  id="nav-search"
                  type="text"
                  placeholder={isUsingLocation ? "Getting your location..." : "City or ZIP Code"}
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value)
                    setIsUsingLocation(false)
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  disabled={isUsingLocation}
                  className={`form-input w-full px-4 py-2 pl-10 pr-24 rounded-lg border text-gray-5 focus:border-light-green focus:ring-2 focus:ring-light-green/20 transition-all duration-300 font-montserrat border-gray-3 ${
                    isUsingLocation ? 'cursor-not-allowed' : ''
                  }`}
                />
                {isUsingLocation ? (
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-light-green" aria-hidden="true" />
                ) : (
                  <Search className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-4 transition-colors duration-300",
                    isSearchFocused && "text-light-green"
                  )} aria-hidden="true" />
                )}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="submit"
                    disabled={!canSearch || isLoading}
                    className="px-3 py-1 rounded font-montserrat font-bold uppercase transition-all duration-300 text-xs flex items-center gap-1 bg-dark-green text-white hover:bg-dark-green/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="hidden sm:inline">Finding...</span>
                      </>
                    ) : (
                      'Search'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={isUsingLocation ? () => {
                      setIsUsingLocation(false)
                      setSearchValue('')
                      setLocationError(null)
                    } : handleUseLocation}
                    disabled={geoLoading}
                    className="p-1 rounded hover:bg-white/10 transition-colors duration-300 group"
                    title={isUsingLocation ? "Cancel location search" : "Use my location"}
                  >
                    {geoLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-light-green" />
                    ) : (
                      <MapPin className="w-4 h-4 text-light-green hover:text-yellow-300 transition-colors" />
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white hover:text-light-green transition-colors duration-300 font-dirk font-bold uppercase"
                  style={{ fontSize: '1rem', lineHeight: '92%', letterSpacing: '0.02em' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-dark-green/80 transition-colors duration-300"
              title="Toggle mobile menu"
            >
              <div className="relative w-6 h-6">
                <Menu className={cn(
                  "absolute inset-0 h-6 w-6 transition-all duration-300",
                  isMobileMenuOpen ? "opacity-0 rotate-45 scale-0" : "opacity-100 rotate-0 scale-100"
                )} />
                <X className={cn(
                  "absolute inset-0 h-6 w-6 transition-all duration-300",
                  isMobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-45 scale-0"
                )} />
              </div>
            </button>
          </div>
        </Container>
      </nav>

      {/* Mobile Menu Overlay - Separate from navbar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Menu content - positioned to start below navbar */}
          <div className="absolute top-16 left-0 right-0 bottom-0 bg-dark-green overflow-y-auto">
            <div className="container mx-auto px-4 py-6">
              {/* Mobile Search */}
              <div className="mb-6">
                <form onSubmit={handleSearch} className="relative group">
                  <label htmlFor="mobile-search" className="sr-only">
                    Search for sports leagues by city or ZIP code
                  </label>
                  <input
                    id="mobile-search"
                    type="text"
                    placeholder={isUsingLocation ? "Getting your location..." : "City or ZIP Code"}
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value)
                      setIsUsingLocation(false)
                    }}
                    disabled={isUsingLocation}
                    className={`form-input w-full px-4 py-3 pl-10 pr-24 rounded-lg border text-gray-5 focus:border-light-green focus:ring-2 focus:ring-light-green/20 font-montserrat border-gray-3 ${
                      isUsingLocation ? 'cursor-not-allowed' : ''
                    }`}
                  />
                  {isUsingLocation ? (
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-green" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-4 transition-colors duration-300 group-focus-within:text-light-green" />
                  )}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="submit"
                      disabled={!canSearch || isLoading}
                      className="px-3 py-2 rounded font-montserrat font-bold uppercase transition-colors duration-300 text-xs flex items-center gap-1 bg-dark-green text-white hover:bg-dark-green/90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Finding...</span>
                        </>
                      ) : (
                        'Search'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={isUsingLocation ? () => {
                        setIsUsingLocation(false)
                        setSearchValue('')
                        setLocationError(null)
                      } : handleUseLocation}
                      disabled={geoLoading}
                      className="p-1 rounded hover:bg-white/10 transition-colors duration-300 group"
                      title={isUsingLocation ? "Cancel location search" : "Use my location"}
                    >
                      {geoLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-light-green" />
                      ) : (
                        <MapPin className="w-4 h-4 text-light-green hover:text-yellow-300 transition-colors" />
                      )}
                    </button>
                  </div>
                </form>
                
                {/* Mobile Clear Location Button */}
                {isUsingLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUsingLocation(false)
                      setSearchValue('')
                      setLocationError(null)
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-montserrat font-medium text-white hover:text-light-green transition-colors"
                  >
                    Cancel location search
                  </button>
                )}

                {/* Mobile Location Error */}
                {(locationError || geoError) && (
                  <p className="mt-2 text-sm text-red-300 text-center">
                    {locationError || geoError}
                  </p>
                )}
              </div>

              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                {MOBILE_NAV_LINKS.map((link, index) => {
                  // Main navigation items (larger font)
                  const isMainNavItem = ['/', '/find-a-league', '/about'].includes(link.href)
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "block px-4 text-white hover:bg-dark-green/20 rounded-lg transition-all duration-300 font-dirk font-bold uppercase",
                        isMainNavItem ? "py-4" : "py-2" // More padding for main items
                      )}
                      style={{ 
                        fontSize: isMainNavItem ? '1.5rem' : '0.75rem', // Large for main nav, small for secondary
                        lineHeight: '92%', 
                        letterSpacing: '0.02em'
                      }}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 