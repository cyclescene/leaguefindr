// ====================================
// GEOCODING SERVICE - Using Nominatim (Free, No API Key)
// ====================================

export interface GeocodingResult {
  lat: number
  lng: number
  displayName: string
  city?: string
  state?: string
  country?: string
}

export interface GeocodingResponse {
  success: boolean
  result?: GeocodingResult
  error?: string
}

// Cache interface for localStorage
interface GeocodingCache {
  [query: string]: {
    result: GeocodingResult
    timestamp: number
  }
}

// Cache duration: 7 days
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000

// Get cache from localStorage
function getCache(): GeocodingCache {
  try {
    const cached = localStorage.getItem('geocoding_cache')
    return cached ? JSON.parse(cached) : {}
  } catch (error) {
    // Silently fail for cache read errors
    return {}
  }
}

// Save cache to localStorage
function saveCache(cache: GeocodingCache): void {
  try {
    localStorage.setItem('geocoding_cache', JSON.stringify(cache))
  } catch (error) {
    // Silently fail for cache save errors
  }
}

// Check if cache entry is still valid
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION
}

// Clean expired cache entries
function cleanCache(cache: GeocodingCache): GeocodingCache {
  const now = Date.now()
  const cleaned: GeocodingCache = {}
  
  Object.entries(cache).forEach(([query, entry]) => {
    if (isCacheValid(entry.timestamp)) {
      cleaned[query] = entry
    }
  })
  
  return cleaned
}

// Format query for consistent caching
function formatQuery(query: string): string {
  return query.trim().toLowerCase()
}

// Parse Nominatim response
function parseNominatimResponse(data: any): GeocodingResult | null {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null
  }

  const result = data[0]
  if (!result.lat || !result.lon) {
    return null
  }

  // Extract location components
  const address = result.address || {}
  
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name || 'Location',
    city: address.city || address.town || address.village || address.hamlet,
    state: address.state,
    country: address.country,
  }
}

// Main geocoding function
export async function geocodeAddress(address: string): Promise<GeocodingResponse> {
  if (!address.trim()) {
    return {
      success: false,
      error: 'Address is required'
    }
  }

  // Check cache first
  const cache = cleanCache(getCache())
  const formattedQuery = formatQuery(address)
  const cached = cache[formattedQuery]
  
  if (cached && isCacheValid(cached.timestamp)) {
    return {
      success: true,
      result: cached.result
    }
  }

  try {
    const encodedAddress = encodeURIComponent(address.trim())
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LeagueFindr/1.0'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        error: 'Geocoding service unavailable'
      }
    }

    const data = await response.json()
    const result = parseNominatimResponse(data)
    
    if (!result) {
      return {
        success: false,
        error: 'Location not found'
      }
    }

    // Cache the result
    cache[formattedQuery] = {
      result,
      timestamp: Date.now()
    }
    saveCache(cache)
    
    return {
      success: true,
      result
    }
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to geocode address'
    }
  }
}

// Reverse geocoding (lat/lng to address)
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResponse> {
  if (!lat || !lng) {
    return {
      success: false,
      error: 'Latitude and longitude are required'
    }
  }

  const cacheKey = `reverse_${lat.toFixed(4)}_${lng.toFixed(4)}`
  
  // Check cache first
  const cache = cleanCache(getCache())
  const cached = cache[cacheKey]
  
  if (cached && isCacheValid(cached.timestamp)) {
    return {
      success: true,
      result: cached.result
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&countrycodes=us`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LeagueFindr/1.0'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        error: 'Reverse geocoding service unavailable'
      }
    }

    const data = await response.json()
    
    if (!data || !data.address) {
      return {
        success: false,
        error: 'Location details not found'
      }
    }

    const address = data.address
    const result: GeocodingResult = {
      lat,
      lng,
      displayName: data.display_name || 'Current Location',
      city: address.city || address.town || address.village,
      state: address.state,
      country: address.country,
    }

    // Cache the result
    cache[cacheKey] = {
      result,
      timestamp: Date.now()
    }
    saveCache(cache)
    
    return {
      success: true,
      result
    }
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to reverse geocode coordinates'
    }
  }
}

// Utility to clear geocoding cache
export function clearGeocodingCache(): void {
  try {
    localStorage.removeItem('geocoding_cache')
  } catch (error) {
    // Silently fail for cache clear errors
  }
} 