import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSupabase } from '@/context/SupabaseContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string; // UUID
  user_id: string; // Clerk user ID (TEXT)
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  related_league_id?: number;
  related_org_id?: string; // UUID
  created_at: string;
  updated_at: string;
}

interface NotificationSubscriptionState {
  notifications: Notification[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to subscribe to real-time notifications via Supabase
 * Listens for INSERT and UPDATE events on the notifications table
 * Filters by the current user's notifications using RLS policies
 */
export const useNotificationSubscription = () => {
  const { userId, isLoaded } = useAuth();
  const { supabase, isLoaded: supabaseLoaded } = useSupabase();
  const [state, setState] = useState<NotificationSubscriptionState>({
    notifications: [],
    isLoading: true,
    error: null,
  });

  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const subscribeToNotifications = useCallback(async (userId: string) => {
    if (!supabase) return;
    try {

      // First, load existing notifications
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setState((prev) => ({
          ...prev,
          notifications: data || [],
          isLoading: false,
        }));
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err,
        }));
        return;
      }

      // Subscribe to real-time updates for this user's notifications
      const notificationsChannel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setState((prev) => ({
              ...prev,
              notifications: [newNotification, ...prev.notifications],
            }));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;
            setState((prev) => ({
              ...prev,
              notifications: prev.notifications.map((notif) =>
                notif.id === updatedNotification.id
                  ? updatedNotification
                  : notif
              ),
            }));
          }
        )
        .subscribe((status) => {
          if (status === 'CLOSED') {
            setChannel(null);
          }
        });

      setChannel(notificationsChannel);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err,
      }));
    }
  }, [supabase]);

  // Subscribe when both Supabase and user are ready
  useEffect(() => {
    if (
      supabaseLoaded &&
      supabase &&
      userId &&
      isLoaded
    ) {
      subscribeToNotifications(userId);
    }
  }, [supabaseLoaded, supabase, userId, isLoaded, subscribeToNotifications]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [channel]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!supabase) return;
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);

        if (error) {
          throw error;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          error: err,
        }));
      }
    },
    [supabase]
  );

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!supabase) return;
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId);

        if (error) {
          throw error;
        }

        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.filter(
            (n) => n.id !== notificationId
          ),
        }));
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          error: err,
        }));
      }
    },
    [supabase]
  );

  return {
    notifications: state.notifications,
    isLoading: state.isLoading,
    error: state.error,
    markAsRead,
    deleteNotification,
  };
};
