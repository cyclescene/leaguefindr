import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// defining the routes that need to be protected
const isProtectedRoute = createRouteMatcher(['/', '/admin(.*?)'])

// Will need to configure this later to protect routes that need auth
// See: https://clerk.com/docs/reference/nextjs/clerk-middleware
export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  console.log('sessionClaims:', sessionClaims)

  const isVerified = (sessionClaims?.emailVerified as boolean) || false
  const userRole = (sessionClaims?.appRole as string) || null


  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname === '/signin' || pathname === '/signup'
  const isVerifyPage = pathname === '/verify-email'
  const isUserDashboard = pathname === '/'
  const isAdminRoute = pathname.startsWith('/admin')

  // Handle routing based on auth state
  if (!userId) {
    // Not authenticated: allow auth pages, redirect from protected routes
    if (isUserDashboard || isAdminRoute || isVerifyPage) {
      return NextResponse.redirect(new URL('/signin', req.url))
    }
  } else if (!isVerified) {
    // Authenticated but unverified: allow verify page, redirect from others
    if (isAuthPage || isUserDashboard || isAdminRoute) {
      return NextResponse.redirect(new URL('/verify-email', req.url))
    }
  } else {
    // Authenticated and verified: handle role-based routing
    const isAdmin = userRole === 'admin'


    // Redirect auth pages to appropriate dashboard
    if (isAuthPage || isVerifyPage) {
      const dashboardUrl = isAdmin ? '/admin' : '/'
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // Route based on role
    if (isAdmin) {
      // Admin trying to access user dashboard: redirect to admin
      if (isUserDashboard) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    } else {
      // Regular user trying to access admin routes: redirect to user dashboard
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/', req.url))
      }
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
