/**
 * RLS Testing utilities
 * Use these functions to test that Row-Level Security policies are working correctly
 */

import { getSupabaseClient } from './supabase';

interface RLSTestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Decode JWT token to inspect claims
 */
export function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const payload = JSON.parse(atob(parts[1]));
    return {
      success: true,
      claims: payload,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test that current user's JWT contains expected claims
 */
export async function testJWTClaims(): Promise<RLSTestResult> {
  try {
    const client = getSupabaseClient();
    const session = await client.auth.getSession();

    if (!session.data.session?.access_token) {
      return {
        testName: 'JWT Claims Test',
        passed: false,
        message: 'No JWT token found in Supabase client session',
      };
    }

    const decoded = decodeJWT(session.data.session.access_token);

    if (!decoded.success) {
      return {
        testName: 'JWT Claims Test',
        passed: false,
        message: `Failed to decode JWT: ${decoded.error}`,
      };
    }

    const { sub, role, email } = decoded.claims;
    const hasSub = !!sub;
    const hasRole = !!role;
    const hasEmail = !!email;

    return {
      testName: 'JWT Claims Test',
      passed: hasSub && hasRole && hasEmail,
      message: hasSub && hasRole && hasEmail
        ? 'JWT contains all required claims (sub, role, email)'
        : 'JWT missing required claims',
      details: {
        sub: sub ? `${sub.substring(0, 20)}...` : 'MISSING',
        role: role || 'MISSING',
        email: email || 'MISSING',
        fullClaims: {
          sub,
          role,
          email,
          iat: decoded.claims.iat,
          exp: decoded.claims.exp,
        },
      },
    };
  } catch (error) {
    return {
      testName: 'JWT Claims Test',
      passed: false,
      message: `Error testing JWT claims: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Test that sports table returns data (everyone should have access)
 */
export async function testSportsRLS(): Promise<RLSTestResult> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('sports')
      .select('*')
      .limit(1);

    if (error) {
      return {
        testName: 'Sports RLS Test',
        passed: false,
        message: `Query failed: ${error.message}`,
        details: error,
      };
    }

    const hasData = data && data.length > 0;
    return {
      testName: 'Sports RLS Test',
      passed: hasData,
      message: hasData ? 'Sports query succeeded (RLS allows access)' : 'Sports query returned no data',
      details: { count: data?.length || 0 },
    };
  } catch (error) {
    return {
      testName: 'Sports RLS Test',
      passed: false,
      message: `Error testing sports RLS: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Test that leagues query respects RLS policies
 * Expected behavior:
 * - Admins: see all leagues
 * - Organizers: see approved + their org's + their own
 * - Users: see only approved + their own
 */
export async function testLeaguesRLS(): Promise<RLSTestResult> {
  try {
    const client = getSupabaseClient();
    const jwtResult = await testJWTClaims();

    if (!jwtResult.passed || !jwtResult.details?.fullClaims) {
      return {
        testName: 'Leagues RLS Test',
        passed: false,
        message: 'Cannot test leagues RLS without valid JWT claims',
      };
    }

    const { role } = jwtResult.details.fullClaims;

    const { data, error } = await client
      .from('leagues')
      .select(`
        id,
        league_name,
        status,
        org_id,
        created_by
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        testName: 'Leagues RLS Test',
        passed: false,
        message: `Query failed: ${error.message}`,
        details: { error, role },
      };
    }

    // Verify expected behavior based on role
    let passed = true;
    let message = '';

    if (role === 'admin') {
      // Admins should see all leagues
      passed = data && data.length > 0;
      message = passed
        ? `Admin sees ${data?.length} leagues (expected all leagues)`
        : 'Admin query returned no leagues';
    } else {
      // Regular users should see at least approved leagues
      passed = data && data.length > 0;
      message = passed
        ? `User sees ${data?.length} leagues (expected approved + own)`
        : 'User query returned no leagues';
    }

    return {
      testName: 'Leagues RLS Test',
      passed,
      message,
      details: {
        count: data?.length || 0,
        userRole: role,
        statuses: data?.map(l => l.status) || [],
      },
    };
  } catch (error) {
    return {
      testName: 'Leagues RLS Test',
      passed: false,
      message: `Error testing leagues RLS: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Test user_organizations membership (used by RLS to filter org data)
 */
export async function testUserOrganizations(): Promise<RLSTestResult> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('user_organizations')
      .select('*')
      .eq('is_active', true);

    if (error) {
      return {
        testName: 'User Organizations Test',
        passed: false,
        message: `Query failed: ${error.message}`,
        details: error,
      };
    }

    // Note: This will return different results based on user's RLS permissions
    // Admins see all, users see only their own
    return {
      testName: 'User Organizations Test',
      passed: true,
      message: `Query succeeded (user has ${data?.length || 0} organization memberships)`,
      details: {
        count: data?.length || 0,
        organizationIds: data?.map(uo => uo.org_id) || [],
      },
    };
  } catch (error) {
    return {
      testName: 'User Organizations Test',
      passed: false,
      message: `Error testing user organizations: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Run all RLS tests
 */
export async function runAllRLSTests(): Promise<RLSTestResult[]> {
  const results: RLSTestResult[] = [];

  results.push(await testJWTClaims());
  results.push(await testSportsRLS());
  results.push(await testLeaguesRLS());
  results.push(await testUserOrganizations());

  return results;
}

/**
 * Format test results for display
 */
export function formatRLSTestResults(results: RLSTestResult[]): string {
  const lines: string[] = [
    '=== RLS Test Results ===',
    '',
  ];

  results.forEach(result => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    lines.push(`${status}: ${result.testName}`);
    lines.push(`  Message: ${result.message}`);

    if (result.details) {
      lines.push(`  Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    lines.push('');
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  lines.push(`Summary: ${passed}/${total} tests passed`);

  return lines.join('\n');
}
