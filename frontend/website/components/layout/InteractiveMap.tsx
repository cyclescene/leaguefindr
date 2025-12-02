'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { League, FilterState, MapPin } from '@/lib/types'
import { MapPin as MapPinIcon } from 'lucide-react'
import { LeagueCard } from '@/components/league'
import { Analytics } from '@/lib/analytics'

// Import Leaflet dynamically to avoid SSR issues
let L: any = null
if (typeof window !== 'undefined') {
  L = require('leaflet')
  require('leaflet/dist/leaflet.css')
  
  // Fix for default markers in Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })


}

interface InteractiveMapProps {
  leagues: League[]
  mapPins?: MapPin[]
  userLocation?: { lat: number; lng: number; radius?: number } | null
  filters?: FilterState
  onFiltersChange?: (filters: FilterState) => void
}

interface VenueCluster {
  id: string
  lat: number
  lng: number
  leagueCount: number
  leagues: League[]
  venueName: string
}

export default function InteractiveMap({ leagues, mapPins, userLocation, filters = {}, onFiltersChange }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [selectedVenue, setSelectedVenue] = useState<VenueCluster | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  const [mapLoading, setMapLoading] = useState(true)
  const [pinsLoading, setPinsLoading] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)



  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Reset scroll position when a new venue is selected
  useEffect(() => {
    if (selectedVenue && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [selectedVenue?.id]) // Only trigger when venue ID changes, not when closing

  // Create venue clusters from leagues
  const createVenueClusters = (leagues: League[]): VenueCluster[] => {
    const venueMap = new Map()
    
    leagues.forEach(league => {
      // Skip venues with invalid coordinates
      if (!league.venue.coordinates || 
          league.venue.coordinates.lat === null || 
          league.venue.coordinates.lng === null ||
          isNaN(league.venue.coordinates.lat) ||
          isNaN(league.venue.coordinates.lng) ||
          Math.abs(league.venue.coordinates.lat) > 90 ||
          Math.abs(league.venue.coordinates.lng) > 180) {
        return
      }

      const venueKey = `${league.venue.coordinates.lat},${league.venue.coordinates.lng}`
      
      if (!venueMap.has(venueKey)) {
        venueMap.set(venueKey, {
          id: venueKey,
          lat: league.venue.coordinates.lat,
          lng: league.venue.coordinates.lng,
          leagueCount: 0,
          leagues: [],
          venueName: league.venue.name
        })
      }
      
      const cluster = venueMap.get(venueKey)
      cluster.leagueCount++
      cluster.leagues.push(league)
    })
    
    return Array.from(venueMap.values())
  }

  // Use API mapPins if available, otherwise create clusters from leagues
  const venueClusters = useMemo(() => {
    if (mapPins && mapPins.length > 0) {
      // Convert API mapPins to VenueCluster format
      return mapPins.map((pin: MapPin) => ({
        id: pin.id,
        lat: pin.lat,
        lng: pin.lng,
        leagueCount: pin.leagueCount,
        leagues: pin.leagues,
        venueName: pin.leagues?.[0]?.venue?.name || `Venue ${pin.id}`
      }))
    }
    // Fallback: create clusters from leagues (existing logic)
    return createVenueClusters(leagues)
  }, [leagues, mapPins])



  // Initialize map with error handling and loading states
  useEffect(() => {
    if (!mapRef.current || !L || mapInstanceRef.current) return

    try {
      setMapLoading(true)
      setMapError(null)

      // Default center (US center)
      let center: [number, number] = [39.8283, -98.5795]
      let zoom = 4

      // If we have user location, center on that
      if (userLocation) {
        center = [userLocation.lat, userLocation.lng]
        zoom = 10
      } else if (venueClusters.length > 0) {
        // Center on first venue if no user location
        center = [venueClusters[0].lat, venueClusters[0].lng]
        zoom = 10
      }

      // Create map instance
      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: !isMobile, // Disable scroll zoom on mobile for better UX
        touchZoom: true,
        doubleClickZoom: true,
        dragging: true,
        tap: true,
        tapTolerance: isMobile ? 15 : 10, // Increase tap tolerance on mobile
        zoomAnimation: true,
        markerZoomAnimation: true
      })

      // Add OpenStreetMap tiles
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      })

      // Only handle critical tile errors
      tileLayer.on('tileerror', () => {
        setMapError('Failed to load map tiles. Please check your connection.')
        setMapLoading(false)
      })

      tileLayer.addTo(map)

      // Track user interactions with the map
      map.on('zoomend moveend', () => {
        setHasUserInteracted(true)
        Analytics.moveOrZoomMap()
      })





      mapInstanceRef.current = map
      setMapLoading(false)

    } catch (error) {
      console.error('Map initialization error:', error)
      setMapError('Failed to initialize map. Please try again or use list view.')
      setMapLoading(false)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isMobile]) // Add isMobile dependency for mobile optimizations

  // Update markers when leagues change
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    // Show pins loading state
    setPinsLoading(true)

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Add user location marker if available
    if (userLocation) {
      const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        fillColor: '#10B981', // light-green
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(mapInstanceRef.current)
      
      userMarker.bindPopup('Your Location')
      markersRef.current.push(userMarker)
    }

    // Add venue markers with performance optimizations
    const markersToAdd: any[] = []
    
    venueClusters.forEach(venue => {
      // Create custom icon based on selection state
      const isSelected = selectedVenue?.id === venue.id
      
      // Dynamic sizing based on league count with better scaling
      let iconSize = 25
      if (venue.leagueCount > 10) iconSize = 35
      else if (venue.leagueCount > 5) iconSize = 32
      else if (venue.leagueCount > 1) iconSize = 28
      
      const iconColor = isSelected ? '#6AC266' : '#FFFFFF'
      const borderColor = isSelected ? '#6AC266' : '#9CA3AF'
      const textColor = isSelected ? '#FFFFFF' : '#374151'
      
      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${iconColor};
            color: ${textColor};
            border-radius: 50%;
            width: ${iconSize}px;
            height: ${iconSize}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${iconSize > 30 ? '14px' : '12px'};
            border: 2px solid ${borderColor};
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: pointer;
          ">
            ${venue.leagueCount}
          </div>
        `,
        className: 'custom-venue-marker',
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2]
      })

      const marker = L.marker([venue.lat, venue.lng], { icon: customIcon })
        .on('click', (e: any) => {
          e.originalEvent?.stopPropagation()
          setSelectedVenue(venue)
          setHasUserInteracted(true)
          Analytics.clickedMapPinCluster(venue.venueName, venue.leagueCount)
        })

      // Simplified popup for desktop (mobile uses drawer)
      if (!isMobile) {
        const popupContent = `
          <div style="min-width: 180px; text-align: center;">
            <h3 style="margin: 0 0 6px 0; font-weight: bold; color: #1F2937; font-size: 14px;">
              ${venue.venueName}
            </h3>
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 12px;">
              ${venue.leagueCount} league${venue.leagueCount > 1 ? 's' : ''}
            </p>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('venue-click', { detail: { venueId: '${venue.id}' } }))"
              style="
                background-color: #10B981;
                color: white;
                border: none;
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                font-weight: 500;
              "
            >
              View Details
            </button>
          </div>
        `
        marker.bindPopup(popupContent, {
          offset: [0, -10],
          closeButton: true,
          autoClose: true,
          closeOnClick: false
        })
      }
      
      markersToAdd.push(marker)
    })

    // Batch add markers for better performance
    markersToAdd.forEach(marker => {
      marker.addTo(mapInstanceRef.current)
      markersRef.current.push(marker)
    })

    // MOBILE FIX: Force map to invalidate size and redraw after markers are added
    // This fixes the issue where markers don't appear until user interaction on mobile
    if (isMobile && markersToAdd.length > 0) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
          // Force a redraw by slightly adjusting the view
          const center = mapInstanceRef.current.getCenter()
          mapInstanceRef.current.setView([center.lat, center.lng], mapInstanceRef.current.getZoom())
        }
        // Hide pins loading state after mobile fix is applied
        setPinsLoading(false)
      }, 100)
    } else {
      // Hide pins loading state immediately for non-mobile
      setPinsLoading(false)
    }

    // Auto-fit bounds only on initial load, not after user has interacted with the map
    if (venueClusters.length > 0 && !hasUserInteracted) {
      const group = new L.featureGroup(markersRef.current)
      const bounds = group.getBounds()
      
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { 
          padding: [20, 20],
          maxZoom: userLocation ? 12 : 10
        })
      }
    } else if (venueClusters.length === 0 && markersRef.current.length === 0) {
      // Show message when no venues are available
      const noVenuesPopup = L.popup({
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        className: 'no-venues-popup'
      })
        .setLatLng(mapInstanceRef.current.getCenter())
        .setContent('<div style="text-align: center; padding: 8px;"><p style="margin: 0; color: #6B7280; font-size: 14px;">No venues found in this area</p><p style="margin: 4px 0 0 0; color: #9CA3AF; font-size: 12px;">Try adjusting your search or filters</p></div>')
        .openOn(mapInstanceRef.current)
        
      // Auto-close after 3 seconds
      setTimeout(() => {
        mapInstanceRef.current?.closePopup(noVenuesPopup)
      }, 3000)
    }

  }, [leagues, userLocation, venueClusters, hasUserInteracted, selectedVenue, isMobile])

  // Handle venue click events from popup
  useEffect(() => {
    const handleVenueClick = (event: any) => {
      const venueId = event.detail.venueId
      const venue = venueClusters.find(v => v.id === venueId)
      if (venue) {
        // Track map pin cluster click
        Analytics.clickedMapPinCluster(venue.venueName, venue.leagueCount)
        setSelectedVenue(venue)
      }
    }

    window.addEventListener('venue-click', handleVenueClick)
    return () => window.removeEventListener('venue-click', handleVenueClick)
  }, [venueClusters])

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="h-full w-full"
        style={{
          // Prevent map from interfering with other elements on mobile
          isolation: 'isolate'
        }}
      />
      
      {/* Loading Overlay */}
      {(mapLoading || pinsLoading) && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="text-center max-w-sm mx-auto p-6">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-light-green mx-auto mb-4"></div>
            {mapLoading ? (
              <>
                <p className="text-sm text-gray-700 font-medium mb-2">Loading interactive map...</p>
                <p className="text-xs text-gray-500">Setting up map view</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 font-medium mb-2">Loading league locations...</p>
                <p className="text-xs text-gray-500">Finding venues in your area</p>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Error Overlay */}
      {mapError && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Temporarily Unavailable</h3>
            <p className="text-sm text-gray-600 mb-4">{mapError}</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setMapError(null)
                  setMapLoading(true)
                  // Trigger re-initialization
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove()
                    mapInstanceRef.current = null
                  }
                }}
                className="w-full px-4 py-2 bg-light-green text-white rounded-lg text-sm font-medium hover:bg-light-green/90 transition-colors"
              >
                Try Again
              </button>
              <p className="text-xs text-gray-500">
                Map functionality is optional - you can still browse leagues in list view
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Venue Details Drawer */}
      {selectedVenue && isMobile && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl z-[999] max-h-[70vh] min-h-[300px] flex flex-col">
          {/* Venue Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-xl flex-shrink-0">
            <div className="flex-1">
              <h3 className="font-dirk font-bold text-lg text-gray-900">
                {selectedVenue.venueName}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedVenue.leagues.length} league{selectedVenue.leagues.length !== 1 ? 's' : ''} at this venue
              </p>
            </div>
            <button
              onClick={() => setSelectedVenue(null)}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 ml-2"
            >
              ×
            </button>
          </div>
          
          {/* Scrollable League Cards Container - This gets all remaining space */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto bg-white min-h-0"
            style={{
              WebkitOverflowScrolling: 'touch', // Smooth iOS scrolling
              overscrollBehavior: 'contain' // Prevent page scroll when drawer scrolling
            }}
          >
            <div className="p-4 space-y-3">
              {selectedVenue.leagues.length > 0 ? (
                selectedVenue.leagues.map((league: League) => (
                  <LeagueCard 
                    key={league.id} 
                    league={league}
                    variant="mobile-drawer"
                    className="shadow-sm" // Clean shadow for mobile
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-medium">
                    No leagues at this venue
                  </p>
                </div>
              )}
              
              {/* Bottom padding for comfortable scrolling */}
              <div className="h-4"></div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Venue Details - League List using existing components */}
      {selectedVenue && !isMobile && (
        <div className="absolute top-4 left-4 bottom-4 w-96 bg-white rounded-lg shadow-xl z-[999] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="font-dirk font-bold text-lg text-gray-900">
                {selectedVenue.venueName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="w-4 h-4" />
                <span>{selectedVenue.leagueCount} league{selectedVenue.leagueCount > 1 ? 's' : ''}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedVenue(null)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Scrollable League Cards using existing LeagueCard component */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedVenue.leagues.map(league => (
              <LeagueCard 
                key={league.id} 
                league={league}
              />
            ))}
            
            {selectedVenue.leagues.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No leagues match current filters</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs z-[900]">
        {/* Small loading indicator for pins */}
        {pinsLoading && !mapLoading && (
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-200 border-t-light-green"></div>
            <span className="text-gray-600">Loading venues...</span>
          </div>
        )}
        
        <div className="space-y-2">
          {userLocation && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-light-green rounded-full border-2 border-white"></div>
              <span>Your Location</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-700 text-xs font-bold">1</div>
            <span>Venue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-light-green rounded-full border-2 border-light-green flex items-center justify-center text-white text-xs font-bold">1</div>
            <span>Selected</span>
          </div>
        </div>
      </div>
      

    </div>
  )
} 