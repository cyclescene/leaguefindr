'use client';

import { useState } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { Button } from '@/components/ui/button';
import {
  runAllRLSTests,
  formatRLSTestResults,
  testJWTClaims,
  decodeJWT,
} from '@/lib/rlsTest';

export function RLSTestPanel() {
  const { supabase, isLoaded } = useSupabase();
  const [testResults, setTestResults] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [jwtInfo, setJwtInfo] = useState<string>('');

  const handleRunTests = async () => {
    if (!supabase || !isLoaded) {
      setTestResults('Supabase client not initialized');
      return;
    }
    setIsRunning(true);
    try {
      const results = await runAllRLSTests(supabase);
      const formatted = formatRLSTestResults(results);
      setTestResults(formatted);
      console.log('RLS Test Results:', results);
    } catch (error) {
      setTestResults(`Error running tests: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleShowJWT = async () => {
    if (!supabase || !isLoaded) {
      setJwtInfo('Supabase client not initialized');
      return;
    }
    try {
      const result = await testJWTClaims(supabase);
      if (result.passed && result.details) {
        setJwtInfo(JSON.stringify(result.details.fullClaims, null, 2));
      } else {
        setJwtInfo(`Failed to get JWT: ${result.message}`);
      }
    } catch (error) {
      setJwtInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 m-4">
      <h2 className="text-lg font-bold mb-4">RLS Policy Testing Panel</h2>

      <div className="space-y-2 mb-4">
        <Button onClick={handleRunTests} disabled={isRunning} className="mr-2">
          {isRunning ? 'Running Tests...' : 'Run RLS Tests'}
        </Button>
        <Button onClick={handleShowJWT} variant="outline" className="mr-2">
          Show JWT Claims
        </Button>
      </div>

      {jwtInfo && (
        <div className="bg-white border border-gray-200 rounded p-3 mb-4">
          <h3 className="font-semibold mb-2">JWT Claims:</h3>
          <pre className="text-xs overflow-auto bg-gray-50 p-2 rounded">
            {jwtInfo}
          </pre>
        </div>
      )}

      {testResults && (
        <div className="bg-white border border-gray-200 rounded p-3">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <pre className="text-xs overflow-auto bg-gray-50 p-2 rounded whitespace-pre-wrap">
            {testResults}
          </pre>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-600">
        <p className="mb-2">
          <strong>How RLS Works:</strong> Row-Level Security policies filter database queries based on the authenticated user's JWT claims and organization membership.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Admins see all leagues regardless of status</li>
          <li>Organizers see: approved leagues + their org's leagues + their own submissions</li>
          <li>Users see: approved leagues + their own submissions</li>
        </ul>
      </div>
    </div>
  );
}
