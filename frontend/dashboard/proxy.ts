import { createClerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const secretKey = process.env.CLERK_SECRET_KEY

// defining the routes that need to be protected
const isProtectedRoute = createRouteMatcher(['/'])

// Will need to configure this later to protect routes that need auth
// See: https://clerk.com/docs/reference/nextjs/clerk-middleware
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const clerk = createClerkClient({
    publishableKey,
    secretKey
  })

  let isVerified = false

  if (userId) {
    const user = await clerk.users.getUser(userId)
    isVerified = user.emailAddresses[0].verification?.status === 'verified'
  }

  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname === '/signin' || pathname === '/signup'
  const isVerifyPage = pathname === '/verify-email'
  const isDashboard = pathname === '/'

  // Handle routing based on auth state
  if (!userId) {
    // Not authenticated: allow auth pages, redirect from protected routes
    if (isDashboard || isVerifyPage) {
      return NextResponse.redirect(new URL('/signin', req.url))
    }
  } else if (!isVerified) {
    // Authenticated but unverified: allow verify page, redirect from others
    if (isAuthPage || isDashboard) {
      return NextResponse.redirect(new URL('/verify-email', req.url))
    }
  } else {
    // Authenticated and verified: allow dashboard, redirect from auth pages
    if (isAuthPage || isVerifyPage) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Protect dashboard routes
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
