import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { setSupabaseToken, clearSupabaseSession } from '@/lib/supabase';

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry

interface TokenState {
  token: string | null;
  loading: boolean;
  error: Error | null;
  expiresAt: number | null;
}

/**
 * Hook to manage Supabase JWT token lifecycle
 * - Fetches token from backend on mount
 * - Automatically refreshes before expiration
 * - Sets token in Supabase client for authenticated requests
 */
export const useSupabaseToken = () => {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const [state, setState] = useState<TokenState>({
    token: null,
    loading: true,
    error: null,
    expiresAt: null,
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleTokenRefresh = useCallback((expiresIn: number) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Refresh when token has 5 minutes left to expiry
    const refreshIn = Math.max(expiresIn * 1000 - TOKEN_REFRESH_THRESHOLD, 0);

    refreshTimeoutRef.current = setTimeout(() => {
      fetchSupabaseToken();
    }, refreshIn);
  }, []);

  const fetchSupabaseToken = useCallback(async () => {
    if (!isSignedIn) {
      setState((prev) => ({ ...prev, loading: false, token: null }));
      await clearSupabaseSession();
      return;
    }

    try {
      // Get Clerk JWT token for authentication to our backend
      const clerkToken = await getToken();
      if (!clerkToken) {
        throw new Error('Failed to get Clerk token');
      }

      // Call backend endpoint to get Supabase JWT token
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${backendUrl}/v1/auth/supabase-token`, {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Supabase token: ${response.statusText}`);
      }

      const data = await response.json();
      const { supabaseToken, expiresIn } = data;

      if (!supabaseToken) {
        throw new Error('No Supabase token in response');
      }

      // Decode token to log role claim (for RLS debugging)
      try {
        const parts = supabaseToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('RLS: User role claim =', payload.role);
        }
      } catch (e) {
        // Silently fail if we can't decode for debugging
      }

      // Set the token in Supabase client
      await setSupabaseToken(supabaseToken);

      // Calculate expiration time
      const expiresAt = Date.now() + expiresIn * 1000;

      setState({
        token: supabaseToken,
        loading: false,
        error: null,
        expiresAt,
      });

      // Schedule token refresh
      scheduleTokenRefresh(expiresIn);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
        token: null,
      }));
    }
  }, [getToken, isSignedIn, scheduleTokenRefresh]);

  // Fetch token on mount and when auth state changes
  useEffect(() => {
    if (isLoaded) {
      fetchSupabaseToken();
    }
  }, [isLoaded, isSignedIn, fetchSupabaseToken]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return state;
};
