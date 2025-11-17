import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let currentToken: string | null = null;

/**
 * Creates or returns the Supabase client instance
 * The client is initialized with a JWT token obtained from the backend
 *
 * For local development: The backend generates Supabase JWTs that Supabase can validate
 * For production: Clerk tokens are used directly with official Clerk-Supabase integration
 */
export const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.'
    );
  }

  // Create client with current token if available
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: currentToken ? {
        Authorization: `Bearer ${currentToken}`,
      } : {},
    },
  });

  return supabaseClient;
};

/**
 * Sets the authorization token for the Supabase client
 * Called after obtaining a new JWT token from the backend
 */
export const setSupabaseToken = async (token: string): Promise<void> => {
  currentToken = token;
};

/**
 * Clears the Supabase session
 */
export const clearSupabaseSession = async (): Promise<void> => {
  currentToken = null;
  const client = getSupabaseClient();
  // Don't call signOut on the client since we're managing tokens manually
};
