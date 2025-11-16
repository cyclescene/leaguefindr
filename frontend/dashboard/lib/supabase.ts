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

  // Debug: Decode and log the token before setting it
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Setting Supabase token with claims:', payload);
    }
  } catch (e) {
    console.error('Failed to decode token for logging:', e);
  }

  await client.auth.setSession({
    access_token: token,
    refresh_token: '',
  });

  // Debug: Log what the client's auth state is after setting session
  const session = await client.auth.getSession();
  console.log('Supabase client session after setSession:', {
    hasSession: !!session.data.session,
    accessToken: session.data.session?.access_token ? `${session.data.session.access_token.substring(0, 50)}...` : null,
  });
};

/**
 * Clears the Supabase session
 */
export const clearSupabaseSession = async (): Promise<void> => {
  const client = getSupabaseClient();
  await client.auth.signOut();
};
