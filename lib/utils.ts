import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { League, FilterState, UserLocation } from './types'

// ====================================
// SIMPLE UTILITIES
// ====================================

// ====================================
// STYLING UTILITIES
// ====================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ====================================
// DATE & TIME UTILITIES
// ====================================

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// ====================================
// REGISTRATION STATUS UTILITIES
// ====================================

export interface RegistrationStatus {
  isOpen: boolean
  daysRemaining: number
  status: 'open' | 'closing-soon' | 'closed' | 'invalid-date'
  message: string
}

export function getRegistrationStatus(registrationDeadline: Date | string): RegistrationStatus {
  const now = new Date()
  
  // Convert string to Date if necessary
  let deadline: Date
  if (typeof registrationDeadline === 'string') {
    deadline = new Date(registrationDeadline)
  } else {
    deadline = registrationDeadline
  }
  
  // Handle invalid dates
  if (!deadline || isNaN(deadline.getTime())) {
    return {
      isOpen: false,
      daysRemaining: 0,
      status: 'invalid-date',
      message: 'Invalid registration deadline'
    }
  }

  // Calculate days remaining (can be negative if past deadline)
  const diffTime = deadline.getTime() - now.getTime()
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Determine status
  if (daysRemaining > 7) {
    return {
      isOpen: true,
      daysRemaining,
      status: 'open',
      message: `${daysRemaining} days remaining`
    }
  } else if (daysRemaining > 0) {
    return {
      isOpen: true,
      daysRemaining,
      status: 'closing-soon',
      message: `Closing soon - ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`
    }
  } else {
    return {
      isOpen: false,
      daysRemaining,
      status: 'closed',
      message: 'Registration closed'
    }
  }
}

// Legacy function for backward compatibility
export function isRegistrationOpen(deadlineString: string): boolean {
  try {
    const deadline = new Date(deadlineString)
    return getRegistrationStatus(deadline).isOpen
  } catch {
    return false
  }
}

export function getDaysUntilDeadline(deadlineString: string): number {
  try {
    const deadline = new Date(deadlineString)
    return getRegistrationStatus(deadline).daysRemaining
  } catch {
    return 0
  }
}

// ====================================
// DISTANCE & GEOLOCATION UTILITIES
// ====================================

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function formatDistance(miles: number): string {
  if (miles < 1) {
    return `${(miles * 5280).toFixed(0)} ft`
  }
  return `${miles.toFixed(1)} mi`
}

// ====================================
// SEARCH & FILTER UTILITIES
// ====================================

export function buildSearchParams(filters: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString())
    }
  })
  
  return params
}

export function parseSearchParams(searchParams: URLSearchParams): FilterState {
  return {
    ageGroup: searchParams.get('ageGroup') as any || undefined,
    sport: searchParams.get('sport') as any || undefined,
    gender: searchParams.get('gender') as any || undefined,
    gameDay: searchParams.get('gameDay') as any || undefined,
    distance: searchParams.get('distance') ? parseInt(searchParams.get('distance')!) : undefined
  }
}

export function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some(value => value !== undefined && value !== null && value !== '')
}

// ====================================
// LEAGUE DATA UTILITIES
// ====================================

export function isLeagueActive(league: League): boolean {
  return isRegistrationOpen(league.registrationDeadline.toISOString())
}

export function getLeaguePriceDisplay(league: League): string {
  if (league.seasonFee) {
    return `$${league.seasonFee}/season`
  }
  if (league.perGameFee) {
    return `$${league.perGameFee}/game`
  }
  return 'Price TBD'
}

export function getGameDaysDisplay(gameDays: string[]): string {
  if (gameDays.length === 0) return 'TBD'
  if (gameDays.length === 1) return gameDays[0]
  if (gameDays.length === 2) return gameDays.join(' & ')
  return `${gameDays.slice(0, -1).join(', ')} & ${gameDays[gameDays.length - 1]}`
}

// ====================================
// URL & SHARING UTILITIES
// ====================================

export function generateLeagueShareUrl(leagueId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/league/${leagueId}`
  }
  return `/league/${leagueId}`
}

export function generateSearchShareUrl(filters: FilterState): string {
  const params = buildSearchParams(filters)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/find-a-league?${params.toString()}`
  }
  return `/find-a-league?${params.toString()}`
}

// ====================================
// VALIDATION UTILITIES
// ====================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zipCode)
}

// ====================================
// LOCAL STORAGE UTILITIES
// ====================================

export function saveToLocalStorage<T>(key: string, data: T): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      // Silently fail for localStorage save errors
    }
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      // Silently fail for localStorage load errors
      return null
    }
  }
  return null
}

// ====================================
// ACCESSIBILITY UTILITIES
// ====================================

export function generateId(prefix: string = 'item'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

export function announceToScreenReader(message: string): void {
  if (typeof window !== 'undefined') {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }
}

// Utility functions for common formatting and validation 

/**
 * Intelligently shortens location names for display in filters
 * Converts long location names to more readable short forms
 * 
 * Examples:
 * "Los Angeles, Los Angeles County, California, USA" -> "Los Angeles, CA"
 * "Miami-Dade County, Florida, USA" -> "Miami-Dade County, FL"
 * "New York, New York County, New York, USA" -> "New York, NY"
 * "Chicago, Cook County, Illinois, USA" -> "Chicago, IL"
 * "Houston, Harris County, Texas, USA" -> "Houston, TX"
 */
export function shortenLocationName(fullLocationName: string): string {
  if (!fullLocationName || fullLocationName.trim() === '') {
    return 'Location'
  }

  // Special case for "Your Location" or similar
  if (fullLocationName.toLowerCase().includes('your location')) {
    return 'Your Location'
  }

  // Split by commas and trim whitespace
  const parts = fullLocationName.split(',').map(part => part.trim()).filter(part => part.length > 0)
  
  if (parts.length <= 2) {
    // Already short enough, return as is
    return fullLocationName
  }

  // US State abbreviations mapping
  const stateAbbreviations: { [key: string]: string } = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
  }

  // Find the state in the parts (usually the last or second-to-last before USA)
  let stateIndex = -1
  let stateAbbrev = ''
  
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].toLowerCase()
    if (stateAbbreviations[part]) {
      stateIndex = i
      stateAbbrev = stateAbbreviations[part]
      break
    }
    // Also check if it's already an abbreviation
    if (part.length === 2 && /^[a-z]{2}$/.test(part)) {
      stateIndex = i
      stateAbbrev = part.toUpperCase()
      break
    }
  }

  // If we found a state, create a short format
  if (stateIndex !== -1 && stateAbbrev) {
    // Get the primary location (usually the first part)
    const primaryLocation = parts[0]
    
    // For cities, use "City, ST" format
    // For counties that don't have a city prefix, keep the county name
    if (primaryLocation.toLowerCase().includes('county')) {
      // If it's a county like "Miami-Dade County", keep it as is
      return `${primaryLocation}, ${stateAbbrev}`
    } else {
      // Regular city format
      return `${primaryLocation}, ${stateAbbrev}`
    }
  }

  // Fallback: If no state found or for non-US locations, use first two parts
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`
  }

  // Last fallback: return the first part only
  return parts[0]
} 