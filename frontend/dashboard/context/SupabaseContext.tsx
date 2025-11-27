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

  useEffect(() => {
    // Wait for Clerk session to be loaded before attempting Supabase initialization
    if (!isSessionLoaded) {
      return
    }

    // If no session after loading, just mark as loaded and don't try to initialize Supabase
    if (!session) {
      setIsLoaded(true)
      return
    }

    const initSupabase = async () => {
      try {
        if (!supabaseUrl || !supabaseKey) {
          throw new Error(`Missing Supabase config: url=${!!supabaseUrl}, key=${!!supabaseKey}`)
        }

        // Create client with dynamic accessToken callback
        // The token will be retrieved on-demand when queries are made
        const client = createClient(
          supabaseUrl,
          supabaseKey,
          {
            accessToken: async () => {
              try {
                // Use cached token by default (caches for 60 seconds)
                const token = await session?.getToken()
                return token
              } catch (tokenErr) {
                console.error('[Supabase] Error getting token:', tokenErr)
                throw tokenErr
              }
            }
          }
        )

        setSupabase(client)
        setIsLoaded(true)
        setIsError(false)
      } catch (error) {
        console.error('[Supabase] Initialization error:', error)
        setIsError(true)
        setIsLoaded(true)
        toast.error('Failed to initialize database connection.')
      }
    }

    initSupabase()

    return () => {
      // Cleanup
    }
  }, [isSessionLoaded, session])

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
