'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
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
  const initializationAttempted = useRef<string | null>(null)
  const tokenRefreshInterval = useRef<NodeJS.Timeout | null>(null)

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    // Wait for Clerk session to be loaded before attempting Supabase initialization
    if (!isSessionLoaded) {
      console.log('[SupabaseContext] Waiting for session to load...')
      return
    }

    // If no session after loading, just mark as loaded and don't try to initialize Supabase
    if (!session) {
      console.log('[SupabaseContext] No session available, clearing client')
      setSupabase(null)
      setIsLoaded(true)
      initializationAttempted.current = null
      return
    }

    console.log('[SupabaseContext] Current Clerk session:', {
      id: session.id,
      userId: session.userId,
      status: session.status,
      user: session.user ? { id: session.user.id, email: session.user.primaryEmailAddress?.emailAddress } : null
    })

    // Always create a new client if session ID changed
    const shouldInitialize = session.id !== initializationAttempted.current

    if (shouldInitialize) {
      console.log('[SupabaseContext] Initializing Supabase with session ID:', session.id)
      initializationAttempted.current = session.id

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
        console.log('[SupabaseContext] ✓ Initial token retrieved for session:', session.id)
        setAuthToken(initialToken)

        // Create client with the initial token
        const client = createClient(
          supabaseUrl,
          supabaseKey,
          {
            global: {
              headers: {
                Authorization: `Bearer ${initialToken}`
              }
            }
          }
        )

        // Set up token refresh every 55 seconds (token expires in 60 seconds)
        if (tokenRefreshInterval.current) {
          clearInterval(tokenRefreshInterval.current)
        }

        tokenRefreshInterval.current = setInterval(async () => {
          try {
            const newToken = await currentSession?.getToken()
            if (newToken) {
              console.log('[SupabaseContext] ✓ Token refreshed for session:', session.id)
              setAuthToken(newToken)
            }
          } catch (refreshErr) {
            console.error('[SupabaseContext] Token refresh failed:', refreshErr)
          }
        }, 55000) // Refresh every 55 seconds

        console.log('[SupabaseContext] ✓ Supabase client created successfully for session:', session.id)
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

    return () => {
      // Cleanup interval on unmount or session change
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current)
      }
    }
  }, [isSessionLoaded, session?.id])

  // Update Supabase client when token changes
  useEffect(() => {
    if (supabase && authToken && supabase.rest?.headers) {
      // Recreate Supabase client with new token
      console.log('[SupabaseContext] Recreating Supabase client with refreshed token')
      const updatedClient = createClient(
        supabaseUrl!,
        supabaseKey!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        }
      )
      setSupabase(updatedClient)
    }
  }, [authToken])

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
