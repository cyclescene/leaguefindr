import { Sport, NavLink, SocialLink } from './types'

// ====================================
// BUSINESS DOMAIN CONSTANTS
// ====================================

// Sports available for filtering (matches tech spec)
export const SPORTS: { value: Sport; label: string; icon: string }[] = [
  { value: 'Soccer', label: 'Soccer', icon: 'Zap' }, // Will replace with proper icons
  { value: 'Pickleball', label: 'Pickleball', icon: 'Circle' },
  { value: 'Basketball', label: 'Basketball', icon: 'Circle' },
  { value: 'Softball', label: 'Softball', icon: 'Circle' },
  { value: 'Volleyball', label: 'Volleyball', icon: 'Circle' },
  { value: 'Kickball', label: 'Kickball', icon: 'Circle' }
] as const

// Age groups for filtering
export const AGE_GROUPS = [
  { value: 'Adult' as const, label: 'Adult Leagues' },
  { value: 'Youth' as const, label: 'Youth Leagues' }
] as const

// ====================================
// NAVIGATION CONSTANTS
// ====================================

// Main navigation links (matches tech spec)
export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/find-a-league', label: 'Find a League' },
  { href: '/about', label: 'About Us' }
] as const

// Mobile-specific navigation (includes legal links per P0 requirements)
export const MOBILE_NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/find-a-league', label: 'Find a League' },
  { href: '/about', label: 'About Us' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/cookies', label: 'Cookie Settings' }
] as const

// Footer navigation links
export const FOOTER_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/find-a-league', label: 'Find a League' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/cookies', label: 'Cookie Settings' }
] as const

// Sort options for league search - MVP: Distance only
export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Best Match', field: 'relevance' as const, direction: 'desc' as const },
  { value: 'distance-asc', label: 'Distance (Closest)', field: 'distance' as const, direction: 'asc' as const }
] as const

// ====================================
// CONTENT CONSTANTS
// ====================================

// Content for informational blocks (exact client specifications)
export const INFO_BLOCKS = [
  {
    title: 'Local Leagues Near You',
    description: 'Explore ADULT AND YOUTH leagues in your neighborhood — from Santa Monica to Pasadena, and everywhere in between.'
  },
  {
    title: 'Filter by What Matters',
    description: 'Quickly sort by sport, coed or single-gender leagues, age group, and schedule preferences.'
  },
  {
    title: 'Share with Friends',
    description: 'Easily share leagues with friends, teammates, or coworkers so you can decide where and when to play — together.'
  },
  {
    title: 'Easy Sign-Up Access',
    description: 'Once you find the right fit, jump straight to the league\'s registration page. We make discovery simple — you handle the game.'
  }
] as const

// Social media links (matches tech spec)
export const SOCIAL_LINKS: SocialLink[] = [
  { platform: 'Instagram', href: 'https://instagram.com', icon: 'Instagram' },
  { platform: 'Twitter', href: 'https://twitter.com', icon: 'Twitter' },
  { platform: 'Facebook', href: 'https://facebook.com', icon: 'Facebook' }
] as const

// ====================================
// APP CONFIG CONSTANTS
// ====================================

// API endpoints (for future use)
export const API_ENDPOINTS = {
  leagues: '/api/leagues',
  search: '/api/leagues/search',
  organizations: '/api/organizations',
  venues: '/api/venues'
} as const

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  limit: 12,
  page: 1
} as const 
