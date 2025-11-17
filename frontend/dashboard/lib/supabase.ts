import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let currentToken: string | null = null;

/**
 * Creates or returns the Supabase client instance
 * The client is initialized with a JWT token obtained from the backend
 *
 * Since we use Clerk for authentication (not Supabase auth), we pass user context
 * via custom headers for RLS policies to evaluate
 */
export const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.'
    );
  }

  // Get user context from window (set by setSupabaseToken)
  const userContext = (window as any).__supabaseUserContext || { userId: '', userRole: 'user' };

  // Always recreate client to include the latest token and user context in headers
  // This ensures every request includes the JWT and RLS-relevant headers
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We'll manage tokens manually via JWT from backend
    },
    global: {
      headers: {
        Authorization: currentToken ? `Bearer ${currentToken}` : `Bearer ${supabaseAnonKey}`,
        // Custom headers for RLS policies (Clerk auth, not Supabase auth)
        'X-User-ID': userContext.userId || '',
        'X-User-Role': userContext.userRole || 'user',
      },
    },
  });

  return supabaseClient;
};

/**
 * Sets the authorization token for the Supabase client
 * Called after obtaining a new JWT token from the backend
 *
 * Since we use Clerk for auth, not Supabase auth, we pass user context
 * via custom headers: x-user-id and x-user-role
 */
export const setSupabaseToken = async (token: string, userId: string, userRole: string): Promise<void> => {
  currentToken = token;

  // Debug: Decode and log the token
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('RLS: Setting token with user:', { userId, userRole });
    }
  } catch (e) {
    console.error('Failed to decode token for logging:', e);
  }

  // Store user context for RLS (sent via custom headers)
  (window as any).__supabaseUserContext = {
    userId,
    userRole,
  };

  console.log('RLS: User context set for custom headers');
};

/**
 * Clears the Supabase session
 */
export const clearSupabaseSession = async (): Promise<void> => {
  const client = getSupabaseClient();
  await client.auth.signOut();
};
