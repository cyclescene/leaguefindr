'use client';

import { useSupabaseToken } from '@/hooks/useSupabaseToken';
import { getSupabaseClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface ConnectionStatus {
  isConnected: boolean;
  message: string;
  error: Error | null;
}

/**
 * Component to test and display Supabase connection status
 * Used during development to verify frontend has access to Supabase
 */
export const SupabaseStatus = () => {
  const tokenState = useSupabaseToken();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    message: 'Testing connection...',
    error: null,
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        if (!tokenState.token) {
          setConnectionStatus({
            isConnected: false,
            message: 'Waiting for token...',
            error: null,
          });
          return;
        }

        // Try to query a simple table to verify connection
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('notification_preferences')
          .select('count()', { count: 'exact', head: true });

        if (error) {
          setConnectionStatus({
            isConnected: false,
            message: 'Failed to connect to Supabase',
            error,
          });
        } else {
          setConnectionStatus({
            isConnected: true,
            message: 'Successfully connected to Supabase!',
            error: null,
          });
        }
      } catch (error) {
        setConnectionStatus({
          isConnected: false,
          message: 'Error testing connection',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    };

    if (tokenState.loading === false) {
      testConnection();
    }
  }, [tokenState.token, tokenState.loading]);

  return (
    <div className="p-4 rounded-lg border">
      <h3 className="font-semibold mb-2">Supabase Status</h3>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600">Token Status:</span>
          {tokenState.loading && <span className="ml-2 text-blue-600">Loading...</span>}
          {!tokenState.loading && tokenState.token && (
            <span className="ml-2 text-green-600">✓ Token obtained</span>
          )}
          {!tokenState.loading && !tokenState.token && (
            <span className="ml-2 text-red-600">✗ No token</span>
          )}
        </div>

        <div>
          <span className="text-gray-600">Connection Status:</span>
          {connectionStatus.isConnected && (
            <span className="ml-2 text-green-600">✓ {connectionStatus.message}</span>
          )}
          {!connectionStatus.isConnected && connectionStatus.error && (
            <span className="ml-2 text-red-600">✗ {connectionStatus.message}</span>
          )}
          {!connectionStatus.isConnected && !connectionStatus.error && (
            <span className="ml-2 text-blue-600">{connectionStatus.message}</span>
          )}
        </div>

        {tokenState.error && (
          <div className="text-red-600 text-xs mt-2">
            Token Error: {tokenState.error.message}
          </div>
        )}

        {connectionStatus.error && (
          <div className="text-red-600 text-xs mt-2">
            Connection Error: {connectionStatus.error.message}
          </div>
        )}

        {tokenState.expiresAt && (
          <div className="text-xs text-gray-500">
            Token expires: {new Date(tokenState.expiresAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};
