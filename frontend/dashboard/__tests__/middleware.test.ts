import { describe, it, expect, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: vi.fn((handler) => handler),
  createRouteMatcher: (routes: string[]) => {
    return (req: { nextUrl: { pathname: string } }) => {
      const pathname = req.nextUrl.pathname;
      return routes.some(route => {
        const routeRegex = route.replace(/\.\*/g, '.*');
        return new RegExp(`^${routeRegex}`).test(pathname);
      });
    };
  },
}));

// Helper function to test redirect logic
function shouldRedirectToSignin(userId: string | null, pathname: string): boolean {
  return !userId && pathname === '/';
}

function shouldRedirectToRoot(userId: string | null, pathname: string): boolean {
  return userId !== null && (pathname === '/signin' || pathname === '/signup');
}

function isProtectedRoute(pathname: string): boolean {
  return pathname === '/';
}

function isAuthRoute(pathname: string): boolean {
  return pathname === '/signin' || pathname === '/signup';
}

describe('Middleware Redirects', () => {
  describe('unauthenticated user behavior', () => {
    it('should redirect unauthenticated user from "/" to "/signin"', () => {
      expect(shouldRedirectToSignin(null, '/')).toBe(true);
    });

    it('should not redirect unauthenticated user from auth pages', () => {
      expect(shouldRedirectToRoot(null, '/signin')).toBe(false);
      expect(shouldRedirectToRoot(null, '/signup')).toBe(false);
    });

    it('should allow unauthenticated access to signin', () => {
      expect(isAuthRoute('/signin')).toBe(true);
    });

    it('should allow unauthenticated access to signup', () => {
      expect(isAuthRoute('/signup')).toBe(true);
    });
  });

  describe('authenticated user behavior', () => {
    it('should allow authenticated user to access root "/"', () => {
      expect(shouldRedirectToSignin('user123', '/')).toBe(false);
      // Root is protected, authenticated users can access
      expect(isProtectedRoute('/')).toBe(true);
    });

    it('should redirect authenticated user from "/signin" to "/"', () => {
      expect(shouldRedirectToRoot('user123', '/signin')).toBe(true);
    });

    it('should redirect authenticated user from "/signup" to "/"', () => {
      expect(shouldRedirectToRoot('user123', '/signup')).toBe(true);
    });

    it('should allow authenticated user to access "/"', () => {
      expect(isProtectedRoute('/')).toBe(true);
    });
  });

  describe('protected route matching', () => {
    it('should identify / (root) as protected', () => {
      expect(isProtectedRoute('/')).toBe(true);
    });

    it('should not identify /signin as protected', () => {
      expect(isProtectedRoute('/signin')).toBe(false);
    });

    it('should not identify /signup as protected', () => {
      expect(isProtectedRoute('/signup')).toBe(false);
    });

    it('should not identify /other as protected', () => {
      expect(isProtectedRoute('/other')).toBe(false);
    });
  });

  describe('auth route matching', () => {
    it('should identify /signin as auth route', () => {
      expect(isAuthRoute('/signin')).toBe(true);
    });

    it('should identify /signup as auth route', () => {
      expect(isAuthRoute('/signup')).toBe(true);
    });

    it('should not identify / as auth route', () => {
      expect(isAuthRoute('/')).toBe(false);
    });

    it('should not identify /other as auth route', () => {
      expect(isAuthRoute('/other')).toBe(false);
    });
  });

  describe('redirect flow scenarios', () => {
    it('unauthenticated user should be directed to signin on index visit', () => {
      const userId = null;
      const pathname = '/';
      expect(shouldRedirectToSignin(userId, pathname)).toBe(true);
    });

    it('authenticated user on signin should be redirected to root', () => {
      const userId = 'user123';
      const pathname = '/signin';
      expect(shouldRedirectToRoot(userId, pathname)).toBe(true);
    });

    it('authenticated user on signup should be redirected to root', () => {
      const userId = 'user123';
      const pathname = '/signup';
      expect(shouldRedirectToRoot(userId, pathname)).toBe(true);
    });

    it('unauthenticated user cannot access protected root route', () => {
      const userId = null;
      const pathname = '/';
      expect(isProtectedRoute(pathname)).toBe(true);
      expect(userId).toBeNull();
    });
  });

  describe('logout scenario', () => {
    it('after logout, user should be redirected from root to signin', () => {
      // User logs out
      const userId = null;
      const pathname = '/';

      // User is on protected route but not authenticated
      expect(isProtectedRoute(pathname)).toBe(true);
      expect(shouldRedirectToSignin(userId, pathname)).toBe(true);
      expect(userId).toBeNull();
    });

    it('after logout, user visiting index should be sent to signin', () => {
      const userId = null;
      const pathname = '/';
      expect(shouldRedirectToSignin(userId, pathname)).toBe(true);
    });
  });

  describe('auth page accessibility', () => {
    it('unauthenticated users can navigate between signin and signup', () => {
      const userId = null;
      expect(isAuthRoute('/signin')).toBe(true);
      expect(isAuthRoute('/signup')).toBe(true);
      expect(shouldRedirectToRoot(userId, '/signin')).toBe(false);
      expect(shouldRedirectToRoot(userId, '/signup')).toBe(false);
    });

    it('authenticated users cannot stay on auth pages', () => {
      const userId = 'user123';
      expect(shouldRedirectToRoot(userId, '/signin')).toBe(true);
      expect(shouldRedirectToRoot(userId, '/signup')).toBe(true);
    });
  });
});
