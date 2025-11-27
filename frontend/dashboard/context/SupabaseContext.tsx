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
  const { user } = useUser()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) {
      return
    }

    // Wait for Clerk session to be loaded before attempting Supabase initialization
    if (!isSessionLoaded) {
      return
    }

    // If no session after loading, just mark as loaded and don't try to initialize Supabase
    if (!session) {
      setIsLoaded(true)
      setHasInitialized(true)
      return
    }

    // Mark as initializing to prevent re-running this effect
    setHasInitialized(true)

    let timeoutId: NodeJS.Timeout
    let retryTimeoutId: NodeJS.Timeout
    let initTimeoutId: NodeJS.Timeout
    let isMounted = true
    let retryCount = 0
    const maxRetries = 1

    const initSupabase = async () => {
      try {
        const client = createClient(
          supabaseUrl!,
          supabaseKey!, {
          accessToken: () => session?.getToken({ skipCache: true })
        })

        // Set a timeout - if Supabase doesn't load in time, show error and continue anyway
        timeoutId = setTimeout(() => {
          if (isMounted && !isLoaded) {
            setIsError(true)
            setIsLoaded(true)
            toast.error('Supabase is taking longer than expected. Some features may be unavailable.')
          }
        }, SUPABASE_TIMEOUT)

        // Try to verify connection with a simple query
        try {
          await client
            .from('users')
            .select('id')
            .limit(1)

          if (isMounted) {
            clearTimeout(timeoutId)
            setSupabase(client)
            setIsLoaded(true)
            setIsError(false)
          }
        } catch (err: any) {
          if (isMounted) {
            clearTimeout(timeoutId)

            // If it's an auth error and we haven't exceeded max retries, retry
            if (err?.message?.includes('authentication') && retryCount < maxRetries) {
              retryCount++
              console.warn(`Supabase auth error, retrying (${retryCount}/${maxRetries})...`, err)
              // Retry after a short delay to allow token to be refreshed
              retryTimeoutId = setTimeout(() => {
                if (isMounted) {
                  initSupabase()
                }
              }, 1000)
              return
            }

            setIsError(true)
            setIsLoaded(true)
            toast.error('Failed to connect to database. Please try again.')
            console.error('Supabase connection error:', err)
          }
        }
      } catch (error) {
        if (isMounted) {
          clearTimeout(timeoutId)
          setIsError(true)
          setIsLoaded(true)
          toast.error('Database connection error. Please try again.')
          console.error('Supabase initialization error:', error)
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
