import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// defining the routes that need to be protected
const isProtectedRoute = createRouteMatcher(['/'])

// Will need to configure this later to protect routes that need auth
// See: https://clerk.com/docs/reference/nextjs/clerk-middleware
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Redirect authenticated users away from signin/signup pages
  if (userId && (req.nextUrl.pathname === '/signin' || req.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Redirect unauthenticated users from index to signin
  if (!userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/signin', req.url))
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
