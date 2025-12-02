import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// NOTE: These NEXT_PUBLIC_ variables are safe to expose to the browser
// - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL (public)  
// - NEXT_PUBLIC_SUPABASE_ANON_KEY: Anonymous/public key (designed to be exposed)
// Real secrets (service_role keys) should NEVER have NEXT_PUBLIC_ prefix

let supabaseInstance: SupabaseClient | null = null
let lastCredentials: { url: string; key: string } | null = null

function getSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check Vercel project settings.')
  }
  
  // Check if credentials have changed or if we don't have an instance
  const currentCredentials = { url: supabaseUrl, key: supabaseAnonKey }
  const credentialsChanged = !lastCredentials || 
    lastCredentials.url !== currentCredentials.url || 
    lastCredentials.key !== currentCredentials.key

  if (!supabaseInstance || credentialsChanged) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
    lastCredentials = currentCredentials
  }

  return supabaseInstance
}

// Export a getter function instead of the client directly
export { getSupabase as supabase }

export default getSupabase 