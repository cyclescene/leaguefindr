'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useSession, useUser } from '@clerk/nextjs'
import { useEffect, useState, createContext, useContext, useRef } from 'react'
import { toast } from 'sonner'

type SupabaseContext = {
  supabase: SupabaseClient | null
  isLoaded: boolean
  isError: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;


const Context = createContext<SupabaseContext>({
  supabase: null,
  isLoaded: false,
  isError: false
})

type Props = {
  children: React.ReactNode
}

export default function SupabaseProvider({ children }: Props) {
  const { session, isLoaded: isSessionLoaded } = useSession()
  const { user, isLoaded: isUserLoaded } = useUser()
  const initializationAttempted = useRef<string | null>(null)
  const tokenRefreshInterval = useRef<NodeJS.Timeout | null>(null)
  const cachedToken = useRef<string | null>(null)

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    // Wait for Clerk session to be loaded before attempting Supabase initialization
    if (!isSessionLoaded) {
      return
    }

    // If no session after loading, just mark as loaded and don't try to initialize Supabase
    if (!session) {
      setSupabase(null)
      setIsLoaded(true)
      initializationAttempted.current = null
      return
    }

    // Always create a new client if session ID changed
    const shouldInitialize = session.id !== initializationAttempted.current

    if (shouldInitialize) {
      initializationAttempted.current = session.id

      const initializeSupabase = async () => {
        try {
          if (!supabaseUrl || !supabaseKey) {
            throw new Error(`Missing Supabase config: url=${!!supabaseUrl}, key=${!!supabaseKey}`)
          }

          // Create a reference to the current session that won't change
          const currentSession = session

          // Get initial token
          const initialToken = await currentSession?.getToken()
          if (!initialToken) {
            throw new Error('Failed to retrieve initial token from Clerk')
          }
          cachedToken.current = initialToken

          // Create client with accessToken callback that uses cached token
          const client = createClient(
            supabaseUrl,
            supabaseKey,
            {
              accessToken: async () => {
                // Return cached token first (instant, no API call)
                if (cachedToken.current) {
                  return cachedToken.current
                }
                // Fallback: fetch new token (shouldn't happen often)
                return await currentSession?.getToken()
              }
            }
          )

          // Set up token refresh every 50 seconds (token expires in 60 seconds)
          if (tokenRefreshInterval.current) {
            clearInterval(tokenRefreshInterval.current)
          }

          tokenRefreshInterval.current = setInterval(async () => {
            try {
              const newToken = await currentSession?.getToken()
              if (newToken) {
                cachedToken.current = newToken
              }
            } catch (refreshErr) {
              console.error('[SupabaseContext] Token refresh failed:', refreshErr)
            }
          }, 50000) // Refresh every 55 seconds

          setSupabase(client)
          setIsLoaded(true)
          setIsError(false)
        } catch (error) {
          console.error('[SupabaseContext] Initialization error:', error)
          setIsError(true)
          setIsLoaded(true)
          toast.error('Failed to initialize database connection.')
        }
      }

      initializeSupabase()
    }

    return () => {
      // Cleanup interval on unmount or session change
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current)
      }
    }
  }, [isSessionLoaded, session?.id, user?.id, isUserLoaded])

  return (
    <Context.Provider value={{ supabase, isLoaded, isError }}>
      {!isLoaded ? (
        <div className="flex items-center justify-center min-h-screen bg-neutral-light">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-dark mx-auto mb-4"></div>
            <p className="text-brand-dark font-medium">Connecting to database...</p>
          </div>
        </div>
      ) : children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return {
    supabase: context.supabase,
    isLoaded: context.isLoaded
  }
}
