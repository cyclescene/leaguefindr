import { useEffect, useState } from 'react';
import { useSupabaseToken } from './useSupabaseToken';
import { getSupabaseClient } from '@/lib/supabase';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
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
      const err = error instanceof Error ? error : new Error(String(error));
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
    refetch: fetchSports,
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
      const err = error instanceof Error ? error : new Error(String(error));
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
    refetch: fetchVenues,
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

      if (error) throw error;

      setState({
        data: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
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
    refetch: fetchLeagues,
  };
}

/**
 * Hook to fetch approved leagues only (public list)
 */
export function useApprovedLeagues() {
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (tokenState.token && tokenState.loading === false) {
      fetchApprovedLeagues();
    }
  }, [tokenState.token, tokenState.loading]);

  const fetchApprovedLeagues = async () => {
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
      const err = error instanceof Error ? error : new Error(String(error));
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
    refetch: fetchApprovedLeagues,
  };
}

/**
 * Hook to fetch a single league by ID
 */
export function useLeagueById(leagueId: string | number | null) {
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (leagueId && tokenState.token && tokenState.loading === false) {
      fetchLeague();
    }
  }, [leagueId, tokenState.token, tokenState.loading]);

  const fetchLeague = async () => {
    if (!leagueId) return;

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
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

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
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (tokenState.token && tokenState.loading === false) {
      fetchOrganizations();
    }
  }, [tokenState.token, tokenState.loading]);

  const fetchOrganizations = async () => {
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
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

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
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (tokenState.token && tokenState.loading === false) {
      fetchAllOrganizations();
    }
  }, [tokenState.token, tokenState.loading]);

  const fetchAllOrganizations = async () => {
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
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

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
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (leagueId && tokenState.token && tokenState.loading === false) {
      fetchGameOccurrences();
    }
  }, [leagueId, tokenState.token, tokenState.loading]);

  const fetchGameOccurrences = async () => {
    if (!leagueId) return;

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
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

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
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (tokenState.token && tokenState.loading === false) {
      fetchDrafts();
    }
  }, [tokenState.token, tokenState.loading]);

  const fetchDrafts = async () => {
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
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

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
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (tokenState.token && tokenState.loading === false) {
      fetchTemplates();
    }
  }, [tokenState.token, tokenState.loading]);

  const fetchTemplates = async () => {
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
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

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
  const tokenState = useSupabaseToken();
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (draftId && tokenState.token && tokenState.loading === false) {
      fetchDraft();
    }
  }, [draftId, tokenState.token, tokenState.loading]);

  const fetchDraft = async () => {
    if (!draftId) return;

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
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        data: null,
        isLoading: false,
        error: err,
      });
    }
  };

  return {
    draft: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchDraft,
  };
}
