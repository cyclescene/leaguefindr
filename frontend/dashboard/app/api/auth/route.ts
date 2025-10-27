const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export async function POST(request: Request) {
  const body = await request.json();
  const url = new URL(request.url);

  // Determine which backend endpoint based on query param
  const action = url.searchParams.get('action');
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
