import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let currentToken: string | null = null;

/**
 * Creates or returns the Supabase client instance
 * The client is initialized with a JWT token obtained from the backend
 */
export const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.'
    );
  }

  // Always recreate client to include the latest token in headers
  // This ensures every request includes the current JWT
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We'll manage tokens manually via JWT from backend
    },
    global: {
      headers: {
        Authorization: currentToken ? `Bearer ${currentToken}` : `Bearer ${supabaseAnonKey}`,
      },
    },
  });

  return supabaseClient;
};

/**
 * Sets the authorization token for the Supabase client
 * Called after obtaining a new JWT token from the backend
 */
export const setSupabaseToken = async (token: string): Promise<void> => {
  const client = getSupabaseClient();
  currentToken = token;

  // Debug: Decode and log the token
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Setting Supabase token with claims:', payload);
    }
  } catch (e) {
    console.error('Failed to decode token for logging:', e);
  }

  // Update the Authorization header for all future requests
  client.auth.setSession({
    access_token: token,
    refresh_token: '',
  } as any);

  console.log('Supabase Authorization header set with token');
};

/**
 * Clears the Supabase session
 */
export const clearSupabaseSession = async (): Promise<void> => {
  const client = getSupabaseClient();
  await client.auth.signOut();
};
