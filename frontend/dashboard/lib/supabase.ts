import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Creates or returns the Supabase client instance
 * The client is initialized with a JWT token obtained from the backend
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase configuration. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.'
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We'll manage tokens manually via JWT from backend
      },
    });
  }

  return supabaseClient;
};

/**
 * Sets the authorization token for the Supabase client
 * Called after obtaining a new JWT token from the backend
 */
export const setSupabaseToken = async (token: string): Promise<void> => {
  const client = getSupabaseClient();
  await client.auth.setSession({
    access_token: token,
    refresh_token: '',
  });
};

/**
 * Clears the Supabase session
 */
export const clearSupabaseSession = async (): Promise<void> => {
  const client = getSupabaseClient();
  await client.auth.signOut();
};
