import { useState, useEffect } from 'react'

export interface GeolocationState {
  loading: boolean
  accuracy: number | null
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  latitude: number | null
  longitude: number | null
  speed: number | null
  timestamp: number | null
  error: string | null
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

const defaultSettings: PositionOptions = {
  enableHighAccuracy: false,
  timeout: Infinity,
  maximumAge: 0,
}

export const useGeolocation = (options: GeolocationOptions = defaultSettings) => {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: null,
    error: null,
  })

  const getCurrentLocation = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by this browser'
      }))
      return
    }

    // Check permission state first (if supported)
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        
        if (permission.state === 'denied') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Location access is blocked. Please enable location access in your browser settings.'
          }))
          return
        }
      }
    } catch (permissionError) {
      // Permissions API not supported, continue with regular geolocation
    }

    const positionOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? false,
      timeout: options.timeout ?? 15000,
      maximumAge: options.maximumAge ?? 300000
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          error: null,
        })
      },
      (error) => {
        let errorMessage = 'Failed to get location'
        
        // Use numeric codes since error constants might not be available
        const isHttps = window.location.protocol === 'https:'
        
        switch (error?.code) {
          case 1: // PERMISSION_DENIED
            if (!isHttps) {
              errorMessage = 'Location requires HTTPS. Try using ngrok or deploy to test mobile location features.'
            } else {
              errorMessage = 'Location access denied. Please enable location access in your browser settings and refresh the page.'
            }
            break
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location information unavailable'
            break
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out'
            break
          default:
            errorMessage = 'Location error occurred'
        }
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
      },
      positionOptions
    )
  }

  useEffect(() => {
    // Better mobile detection
    const isMobile = () => {
      // Check for touch capability and screen size
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth <= 768
      const isMobileUA = /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      return (hasTouch && isSmallScreen) || isMobileUA
    }
    
    if (!isMobile()) {
      // Auto-request location on desktop
      getCurrentLocation()
    } else {
      // On mobile, just stop loading without requesting
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  return { ...state, getCurrentLocation }
} 