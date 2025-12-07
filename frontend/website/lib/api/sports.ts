import { DatabaseSport } from '../types'
import { supabase } from '../supabase'

// ====================================
// SPORTS API - Supabase Integration
// ====================================

interface SportsResponse {
  success: boolean
  data: DatabaseSport[] | null
  error?: string
}

export class SportsApi {
  // Get all available sports
  static async getAllSports(): Promise<SportsResponse> {
    try {
      const supabaseClient = supabase()

      if (!supabaseClient) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabaseClient
        .from('sports')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        throw error
      }

      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch sports'
      }
    }
  }

  // Get sport by ID
  static async getSportById(id: number): Promise<SportsResponse> {
    try {
      const supabaseClient = supabase()

      if (!supabaseClient) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabaseClient
        .from('sports')
        .select('id, name')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: data ? [data] : null
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch sport'
      }
    }
  }
}
