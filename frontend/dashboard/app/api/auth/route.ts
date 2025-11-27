import { auth } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // Handle session sync request - just return current Clerk auth state
  if (action === 'sync-session') {
    try {
      const { sessionClaims, userId } = await auth();
      const userRole = (sessionClaims?.appRole as string) || "organizer";

      return new Response(
        JSON.stringify({
          userId,
          role: userRole,
          verified: (sessionClaims?.emailVerified as boolean) || false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error syncing session:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to sync session' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // For other actions, parse the body and proxy to backend
  const body = await request.json();
  let backendEndpoint = '';

  if (action === 'login') {
    backendEndpoint = '/v1/auth/login';
  } else if (action === 'register') {
    backendEndpoint = '/v1/auth/register';
  }

  const response = await fetch(`${BACKEND_URL}${backendEndpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  const response = await fetch(`${BACKEND_URL}/v1/auth/user/${sessionId}`);
  return response;
}
