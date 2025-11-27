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

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

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

        // Create client with dynamic accessToken callback
        // The token will be retrieved on-demand when queries are made
        const client = createClient(
          supabaseUrl,
          supabaseKey,
          {
            accessToken: async () => {
              try {
                // Always use the current session reference
                const token = await currentSession?.getToken()
                console.log('[SupabaseContext] Retrieved token for session:', currentSession.id, 'Token exists:', !!token)
                return token
              } catch (tokenErr: any) {
                console.error('[SupabaseContext] Error getting token for session:', currentSession.id, tokenErr)

                // If it's a 401/auth error, the session is invalid
                if (tokenErr?.status === 401 || tokenErr?.message?.includes('Unauthorized') || tokenErr?.message?.includes('authentication')) {
                  console.error('[SupabaseContext] Session is invalid (401), clearing client and resetting')
                  // Reset the initialization ref to force a new client creation
                  initializationAttempted.current = false
                  setSupabase(null)
                  // Don't try to end session - it's likely already invalid
                }
                throw tokenErr
              }
            }
          }
        )

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
      // Cleanup
    }
  }, [isSessionLoaded, session?.id])

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
