import { useEffect, useState, useCallback } from 'react';
import { useSession } from '@clerk/nextjs';
import { getSupabaseClient } from '@/lib/supabase';
import { useSupabaseToken } from './useSupabaseToken';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Helper function to stringify error objects for better debugging
 */
function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }
  return String(error);
}


/**
 * Hook to fetch sports (reference data - everyone can read)
 */
export function useSports() {
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (tokenState.token && tokenState.loading === false) {
      fetchSports();
    }
  }, [tokenState.token, tokenState.loading]);

  const fetchSports = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('sports')
        .select('*')
        .order('name');

      if (error) throw error;

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useSports - Error fetching sports:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

  return {
    sports: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
  };
}

/**
 * Hook to fetch venues (reference data - everyone can read)
 */
export function useVenues() {
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (tokenState.token && tokenState.loading === false) {
      fetchVenues();
    }
  }, [tokenState.token, tokenState.loading]);

  const fetchVenues = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('venues')
        .select('*')
        .order('name');

      if (error) throw error;

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useVenues - Error fetching venues:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

  return {
    venues: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
  };
}

/**
 * Hook to fetch leagues (with RLS filtering)
 * Admins see all leagues, users see approved + their own
 */
export function useLeaguesReadOnly() {
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (tokenState.token && tokenState.loading === false) {
      fetchLeagues();
    }
  }, [tokenState.token, tokenState.loading]);

  const fetchLeagues = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leagues')
        .select(`
          *,
          game_occurrences(*),
          organizations(id, org_name, org_email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        const errorMessage = stringifyError(error);
        console.error('useLeaguesReadOnly - Error fetching leagues:', errorMessage);
        throw error;
      }

      console.log('useLeaguesReadOnly: Leagues query returned', {
        count: data?.length,
        statuses: data?.map(l => l.status),
      });

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useLeaguesReadOnly - Caught error:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

  return {
    leagues: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
  };
}

/**
 * Hook to fetch approved leagues only (public list)
 */
export function useApprovedLeagues() {
  const { session } = useSession();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchApprovedLeagues = useCallback(async () => {
    if (!session) return;

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leagues')
        .select(`
          *,
          game_occurrences(*),
          organizations(id, org_name, org_email)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useApprovedLeagues - Error fetching approved leagues:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchApprovedLeagues();
    }
  }, [session, fetchApprovedLeagues]);

  return {
    leagues: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchApprovedLeagues,
  };
}

/**
 * Hook to fetch a single league by ID
 */
export function useLeagueById(leagueId: string | number | null) {
  const { session } = useSession();
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchLeague = useCallback(async () => {
    if (!leagueId || !session) return;

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leagues')
        .select(`
          *,
          game_occurrences(*),
          organizations(id, org_name, org_email)
        `)
        .eq('id', leagueId)
        .single();

      if (error) throw error;

      setState({
        data: data || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useLeagueById - Error fetching league:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  }, [leagueId, session]);

  useEffect(() => {
    if (leagueId && session) {
      fetchLeague();
    }
  }, [leagueId, session, fetchLeague]);

  return {
    league: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchLeague,
  };
}

/**
 * Hook to fetch user's organizations (based on membership)
 */
export function useUserOrganizations() {
  const { session } = useSession();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchOrganizations = useCallback(async () => {
    if (!session) return;

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('organizations')
        .select('*')
        .order('org_name');

      if (error) throw error;

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useUserOrganizations - Error fetching organizations:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchOrganizations();
    }
  }, [session, fetchOrganizations]);

  return {
    organizations: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchOrganizations,
  };
}

/**
 * Hook to fetch all organizations (admin only via RLS)
 * Regular users will get filtered results based on their membership
 */
export function useAllOrganizations() {
  const { session } = useSession();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchAllOrganizations = useCallback(async () => {
    if (!session) return;

    try {
      const client = getSupabaseClient();
      // This will return all orgs for admins, filtered for regular users by RLS
      const { data, error } = await client
        .from('organizations')
        .select(`
          *,
          user_organizations(count)
        `)
        .order('org_name');

      if (error) throw error;

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useAllOrganizations - Error fetching all organizations:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAllOrganizations();
    }
  }, [session, fetchAllOrganizations]);

  return {
    organizations: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchAllOrganizations,
  };
}

/**
 * Hook to fetch game occurrences for a specific league
 */
export function useGameOccurrences(leagueId: string | number | null) {
  const { session } = useSession();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchGameOccurrences = useCallback(async () => {
    if (!leagueId || !session) return;

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('game_occurrences')
        .select('*')
        .eq('league_id', leagueId)
        .order('day');

      if (error) throw error;

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useGameOccurrences - Error fetching game occurrences:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  }, [leagueId, session]);

  useEffect(() => {
    if (leagueId && session) {
      fetchGameOccurrences();
    }
  }, [leagueId, session, fetchGameOccurrences]);

  return {
    gameOccurrences: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchGameOccurrences,
  };
}

/**
 * Hook to fetch user's league drafts
 */
export function useLeagueDrafts() {
  const { session } = useSession();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchDrafts = useCallback(async () => {
    if (!session) return;

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leagues_drafts')
        .select('*')
        .eq('type', 'draft')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useLeagueDrafts - Error fetching drafts:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchDrafts();
    }
  }, [session, fetchDrafts]);

  return {
    drafts: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchDrafts,
  };
}

/**
 * Hook to fetch user's league templates
 */
export function useLeagueTemplates() {
  const { session } = useSession();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchTemplates = useCallback(async () => {
    if (!session) return;

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leagues_drafts')
        .select('*')
        .eq('type', 'template')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useLeagueTemplates - Error fetching templates:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchTemplates();
    }
  }, [session, fetchTemplates]);

  return {
    templates: state.data || [],
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchTemplates,
  };
}

/**
 * Hook to fetch a single draft or template by ID
 */
export function useDraftById(draftId: string | number | null) {
  const { session } = useSession();
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchDraft = useCallback(async () => {
    if (!draftId || !session) return;

    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('leagues_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (error) throw error;

      setState({
        data: data || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = stringifyError(error);
      console.error('useDraftById - Error fetching draft:', errorMessage);
      const err = new Error(errorMessage);
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  }, [draftId, session]);

  useEffect(() => {
    if (draftId && session) {
      fetchDraft();
    }
  }, [draftId, session, fetchDraft]);

  return {
    draft: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchDraft,
  };
}
