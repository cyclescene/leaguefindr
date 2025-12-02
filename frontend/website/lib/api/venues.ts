import { Venue } from '../types'

// ====================================
// VENUES API - Ready for Supabase Integration
// ====================================

export class VenuesApi {
  // Get all venues
  static async getVenues(): Promise<Venue[]> {
    // Implementation pending - will query 'venues' table
    throw new Error('Venue API not yet implemented')
  }

  // Get venue by ID
  static async getVenueById(id: string): Promise<Venue> {
    // Implementation pending - will query venues.id = id
    throw new Error('Venue API not yet implemented')
  }

  // Get venues in geographic area (for map view)
  static async getVenuesInRadius(
    lat: number,
    lng: number,
    radiusMiles: number
  ): Promise<Venue[]> {
    // Implementation pending - will use PostGIS distance queries
    throw new Error('Venue API not yet implemented')
  }

  // Search venues by name/address
  static async searchVenues(query: string): Promise<Venue[]> {
    // Implementation pending - will search venue.name and venue.address
    throw new Error('Venue API not yet implemented')
  }

  // Get venue leagues
  static async getVenueLeagues(venueId: string) {
    // Implementation pending - will join venues and leagues tables
    throw new Error('Venue API not yet implemented')
  }

  // Get popular venues (most leagues)
  static async getPopularVenues(limit: number = 10): Promise<Venue[]> {
    // Implementation pending - will count leagues per venue
    throw new Error('Venue API not yet implemented')
  }
} 