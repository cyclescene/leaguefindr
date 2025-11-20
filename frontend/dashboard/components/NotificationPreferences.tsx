'use client';

import { useAuth } from '@clerk/nextjs';
import { useSupabase } from '@/context/SupabaseContext';
import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';

export interface NotificationPreference {
  id: string;
  user_id: string;
  league_approved: boolean;
  league_rejected: boolean;
  league_submitted: boolean;
  draft_saved: boolean;
  template_saved: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Notification Preferences Component
 * Allows users to manage their notification settings
 */
export function NotificationPreferences() {
  const { userId } = useAuth();
  const { supabase, isLoaded } = useSupabase();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(
    null
  );

  // Load preferences on component mount
  useEffect(() => {
    if (isLoaded && supabase && userId) {
      loadPreferences();
    }
  }, [isLoaded, supabase, userId]);

  const loadPreferences = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is expected for new users
        throw error;
      }

      if (!data) {
        // Create default preferences for new user
        const insertData = {
          user_id: userId,
          league_approved: true,
          league_rejected: true,
          league_submitted: true,
          draft_saved: true,
          template_saved: true,
        };

        const { data: newPref, error: createError } = await supabase
          .from('notification_preferences')
          .insert(insertData)
          .select()
          .single();


        if (createError) {
          throw createError;
        }

        setPreferences(newPref);
      } else {
        setPreferences(data);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreference) => {
    if (preferences) {
      setPreferences({
        ...preferences,
        [key]: !preferences[key],
      });
    }
  };

  const handleSave = async () => {
    if (!preferences || !supabase) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          league_approved: preferences.league_approved,
          league_rejected: preferences.league_rejected,
          league_submitted: preferences.league_submitted,
          draft_saved: preferences.draft_saved,
          template_saved: preferences.template_saved,
        })
        .eq('id', preferences.id);

      if (error) throw error;

      success('Preferences saved successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      showError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-brand-dark" size={40} />
        <p className="text-neutral-600 ml-4">Loading preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
        <p className="text-neutral-600">Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-8 border border-neutral-200">
      <h2 className="text-2xl font-bold text-brand-dark mb-6">
        Notification Preferences
      </h2>

      <div className="space-y-6">
        {/* League Notifications Section */}
        <div>
          <h3 className="text-lg font-semibold text-brand-dark mb-4">
            League Notifications
          </h3>
          <div className="space-y-4 pl-4 border-l-2 border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  League Approved
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Get notified when your submitted league is approved
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.league_approved}
                onChange={() => handleToggle('league_approved')}
                className="w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  League Rejected
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Get notified when your submitted league is rejected
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.league_rejected}
                onChange={() => handleToggle('league_rejected')}
                className="w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  League Submitted (Admin)
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Admins receive notifications when a new league is submitted
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.league_submitted}
                onChange={() => handleToggle('league_submitted')}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Auto-Save Notifications Section */}
        <div>
          <h3 className="text-lg font-semibold text-brand-dark mb-4">
            Auto-Save Notifications
          </h3>
          <div className="space-y-4 pl-4 border-l-2 border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Draft Saved
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Get notified when your draft is auto-saved
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.draft_saved}
                onChange={() => handleToggle('draft_saved')}
                className="w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Template Saved
                </label>
                <p className="text-xs text-neutral-500 mt-1">
                  Get notified when your template is saved
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.template_saved}
                onChange={() => handleToggle('template_saved')}
                className="w-5 h-5 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
