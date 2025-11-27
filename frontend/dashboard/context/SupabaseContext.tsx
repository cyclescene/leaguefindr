'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useEffect, useState, createContext, useContext } from 'react'
import { toast } from 'sonner'

type SupabaseContext = {
  supabase: SupabaseClient | null
  isLoaded: boolean
  isError: boolean
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// 5 second timeout for Supabase initialization
const SUPABASE_TIMEOUT = 5000;

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

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    console.log('[SupabaseContext] Effect running:', { hasInitialized, isSessionLoaded, hasSession: !!session })

    // Prevent multiple initializations
    if (hasInitialized) {
      console.log('[SupabaseContext] Already initialized, skipping')
      return
    }

    // Wait for Clerk session to be loaded before attempting Supabase initialization
    if (!isSessionLoaded) {
      console.log('[SupabaseContext] Waiting for session to load...')
      return
    }

    // If no session after loading, just mark as loaded and don't try to initialize Supabase
    if (!session) {
      console.log('[SupabaseContext] No session found, marking as loaded without Supabase')
      setIsLoaded(true)
      setHasInitialized(true)
      return
    }

    // Mark as initializing to prevent re-running this effect
    console.log('[SupabaseContext] Starting Supabase initialization...')
    setHasInitialized(true)

    let timeoutId: NodeJS.Timeout
    let retryTimeoutId: NodeJS.Timeout
    let initTimeoutId: NodeJS.Timeout
    let isMounted = true
    let retryCount = 0
    const maxRetries = 1

    const initSupabase = async () => {
      try {
        console.log('[Supabase] Starting initialization...')

        if (!supabaseUrl || !supabaseKey) {
          throw new Error(`Missing Supabase config: url=${!!supabaseUrl}, key=${!!supabaseKey}`)
        }

        const client = createClient(
          supabaseUrl,
          supabaseKey, {
          accessToken: async () => {
            console.log('[Supabase] Getting access token...')
            try {
              const token = await session?.getToken({ skipCache: true })
              console.log('[Supabase] Token retrieved:', !!token)
              return token
            } catch (tokenErr) {
              console.error('[Supabase] Error getting token:', tokenErr)
              throw tokenErr
            }
          }
        })

        console.log('[Supabase] Client created, setting timeout...')

        // Set a timeout - if Supabase doesn't load in time, show error and continue anyway
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('[Supabase] Timeout reached (5s), marking as loaded with error')
            setIsError(true)
            setIsLoaded(true)
            toast.error('Supabase is taking longer than expected. Some features may be unavailable.')
          }
        }, SUPABASE_TIMEOUT)

        // Try to verify connection with a simple query
        console.log('[Supabase] Testing connection with query...')
        try {
          const { data, error } = await client
            .from('users')
            .select('id')
            .limit(1)

          if (error) {
            throw error
          }

          if (isMounted) {
            console.log('[Supabase] ✓ Connection successful, data:', data)
            clearTimeout(timeoutId)
            setSupabase(client)
            setIsLoaded(true)
            setIsError(false)
          }
        } catch (err: any) {
          if (isMounted) {
            clearTimeout(timeoutId)

            const errorMessage = err?.message || String(err)
            const errorCode = err?.code || err?.status
            console.error('[Supabase] Query failed:', { message: errorMessage, code: errorCode, fullError: err })

            // If it's an auth error and we haven't exceeded max retries, retry
            if ((errorMessage.includes('authentication') || errorMessage.includes('401')) && retryCount < maxRetries) {
              retryCount++
              console.warn(`[Supabase] Auth error, retrying (${retryCount}/${maxRetries})...`)
              // Retry after a short delay to allow token to be refreshed
              retryTimeoutId = setTimeout(() => {
                if (isMounted) {
                  initSupabase()
                }
              }, 1000)
              return
            }

            // For non-auth errors, still set the client but mark error
            // This allows the app to continue even if test query fails
            if (isMounted) {
              console.warn('[Supabase] Test query failed but continuing anyway:', errorMessage)
              clearTimeout(timeoutId)
              setSupabase(client)
              setIsLoaded(true)
              setIsError(true)
              toast.warning('Database connection established but test query failed. Some features may be limited.')
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          clearTimeout(timeoutId)
          console.error('[Supabase] Initialization error:', error)
          setIsError(true)
          setIsLoaded(true)
          toast.error('Database connection error. Please try again.')
        }
      }
    }

    // Initialize Supabase with the current session
    initSupabase()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      clearTimeout(retryTimeoutId)
      clearTimeout(initTimeoutId)
    }
  }, [isSessionLoaded, hasInitialized])

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
