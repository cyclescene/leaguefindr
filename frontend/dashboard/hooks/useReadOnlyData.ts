import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/context/SupabaseContext';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Helper function to stringify error objects for better debugging
 * Handles Supabase PostgrestError and other error types
 */
export function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    // Handle Supabase PostgrestError which has specific properties
    const err = error as Record<string, unknown>;

    // Check for Supabase error properties
    if ('code' in err || 'message' in err || 'details' in err || 'hint' in err) {
      return JSON.stringify({
        code: err.code || null,
        message: err.message || null,
        details: err.details || null,
        hint: err.hint || null,
      }, null, 2);
    }

    // Try generic JSON stringify
    try {
      const serialized = JSON.stringify(error, null, 2);
      if (serialized === '{}') {
        // If result is empty object, extract properties manually
        const keys = Object.keys(error);
        const props: Record<string, unknown> = {};
        for (const key of keys) {
          try {
            props[key] = (error as Record<string, unknown>)[key];
          } catch {
            props[key] = '[non-serializable]';
          }
        }
        return JSON.stringify(props, null, 2);
      }
      return serialized;
    } catch {
      // If JSON.stringify fails, try toString
      try {
        return String(error);
      } catch {
        return '[Unable to stringify error]';
      }
    }
  }
  return String(error);
}

/**
 * Hook to fetch sports (reference data - everyone can read)
 */
export function useSports() {
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!isLoaded || !supabase) return;
    fetchSports();
  }, [isLoaded, supabase]);

  const fetchSports = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .order('lower_sport_name', { ascending: true });

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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!isLoaded || !supabase) return;
    fetchVenues();
  }, [isLoaded, supabase]);

  const fetchVenues = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('lower_venue_name', { ascending: true });

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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!isLoaded || !supabase) return;
    fetchLeagues();
  }, [isLoaded, supabase]);

  const fetchLeagues = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchApprovedLeagues = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
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
  }, [supabase]);

  useEffect(() => {
    if (isLoaded && supabase) {
      fetchApprovedLeagues();
    }
  }, [isLoaded, supabase, fetchApprovedLeagues]);

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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchLeague = useCallback(async () => {
    if (!leagueId || !supabase) return;

    try {
      const { data, error } = await supabase
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
  }, [leagueId, supabase]);

  useEffect(() => {
    if (leagueId && isLoaded && supabase) {
      fetchLeague();
    }
  }, [leagueId, isLoaded, supabase, fetchLeague]);

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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchOrganizations = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('lower_org_name', { ascending: true });

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
  }, [supabase]);

  useEffect(() => {
    if (isLoaded && supabase) {
      fetchOrganizations();
    }
  }, [isLoaded, supabase, fetchOrganizations]);

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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchAllOrganizations = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          user_organizations(count)
        `)
        .order('lower_org_name', { ascending: true });

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
  }, [supabase]);

  useEffect(() => {
    if (isLoaded && supabase) {
      fetchAllOrganizations();
    }
  }, [isLoaded, supabase, fetchAllOrganizations]);

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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchGameOccurrences = useCallback(async () => {
    if (!leagueId || !supabase) return;

    try {
      const { data, error } = await supabase
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
  }, [leagueId, supabase]);

  useEffect(() => {
    if (leagueId && isLoaded && supabase) {
      fetchGameOccurrences();
    }
  }, [leagueId, isLoaded, supabase, fetchGameOccurrences]);

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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchDrafts = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
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
  }, [supabase]);

  useEffect(() => {
    if (isLoaded && supabase) {
      fetchDrafts();
    }
  }, [isLoaded, supabase, fetchDrafts]);

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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any[]>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchTemplates = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
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
  }, [supabase]);

  useEffect(() => {
    if (isLoaded && supabase) {
      fetchTemplates();
    }
  }, [isLoaded, supabase, fetchTemplates]);

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
  const { supabase, isLoaded } = useSupabase();
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchDraft = useCallback(async () => {
    if (!draftId || !supabase) return;

    try {
      const { data, error } = await supabase
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
  }, [draftId, supabase]);

  useEffect(() => {
    if (draftId && isLoaded && supabase) {
      fetchDraft();
    }
  }, [draftId, isLoaded, supabase, fetchDraft]);

  return {
    draft: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchDraft,
  };
}
