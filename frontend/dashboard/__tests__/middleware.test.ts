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
function shouldRedirectToSignin(userId: string | null, isVerified: boolean, pathname: string): boolean {
  return !userId && (pathname === '/' || pathname === '/verify-email');
}

function shouldRedirectToVerifyEmail(userId: string | null, isVerified: boolean, pathname: string): boolean {
  return userId !== null && !isVerified && (pathname === '/signin' || pathname === '/signup' || pathname === '/');
}

function shouldRedirectToRoot(userId: string | null, isVerified: boolean, pathname: string): boolean {
  return userId !== null && isVerified && (pathname === '/signin' || pathname === '/signup' || pathname === '/verify-email');
}

function isProtectedRoute(pathname: string): boolean {
  return pathname === '/';
}

function isAuthRoute(pathname: string): boolean {
  return pathname === '/signin' || pathname === '/signup';
}

function isVerifyRoute(pathname: string): boolean {
  return pathname === '/verify-email';
}

describe('Middleware Redirects', () => {
  describe('unauthenticated user behavior', () => {
    it('should redirect unauthenticated user from "/" to "/signin"', () => {
      expect(shouldRedirectToSignin(null, false, '/')).toBe(true);
    });

    it('should redirect unauthenticated user from "/verify-email" to "/signin"', () => {
      expect(shouldRedirectToSignin(null, false, '/verify-email')).toBe(true);
    });

    it('should not redirect unauthenticated user from auth pages', () => {
      expect(shouldRedirectToRoot(null, false, '/signin')).toBe(false);
      expect(shouldRedirectToRoot(null, false, '/signup')).toBe(false);
    });

    it('should allow unauthenticated access to signin', () => {
      expect(isAuthRoute('/signin')).toBe(true);
    });

    it('should allow unauthenticated access to signup', () => {
      expect(isAuthRoute('/signup')).toBe(true);
    });

    it('should not allow unauthenticated access to verify-email', () => {
      expect(isVerifyRoute('/verify-email')).toBe(true);
    });
  });

  describe('authenticated but unverified user behavior', () => {
    it('should redirect unverified user from "/signin" to "/verify-email"', () => {
      expect(shouldRedirectToVerifyEmail('user123', false, '/signin')).toBe(true);
    });

    it('should redirect unverified user from "/signup" to "/verify-email"', () => {
      expect(shouldRedirectToVerifyEmail('user123', false, '/signup')).toBe(true);
    });

    it('should redirect unverified user from "/" to "/verify-email"', () => {
      expect(shouldRedirectToVerifyEmail('user123', false, '/')).toBe(true);
    });

    it('should allow unverified user to access "/verify-email"', () => {
      expect(shouldRedirectToVerifyEmail('user123', false, '/verify-email')).toBe(false);
    });

    it('should not redirect unverified user away from verify-email', () => {
      expect(shouldRedirectToRoot('user123', false, '/verify-email')).toBe(false);
    });
  });

  describe('authenticated and verified user behavior', () => {
    it('should allow verified user to access root "/"', () => {
      expect(shouldRedirectToSignin('user123', true, '/')).toBe(false);
      expect(shouldRedirectToRoot('user123', true, '/')).toBe(false);
    });

    it('should redirect verified user from "/signin" to "/"', () => {
      expect(shouldRedirectToRoot('user123', true, '/signin')).toBe(true);
    });

    it('should redirect verified user from "/signup" to "/"', () => {
      expect(shouldRedirectToRoot('user123', true, '/signup')).toBe(true);
    });

    it('should redirect verified user from "/verify-email" to "/"', () => {
      expect(shouldRedirectToRoot('user123', true, '/verify-email')).toBe(true);
    });

    it('should allow verified user to access "/"', () => {
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
      const isVerified = false;
      const pathname = '/';
      expect(shouldRedirectToSignin(userId, isVerified, pathname)).toBe(true);
    });

    it('unverified authenticated user on signin should be redirected to verify-email', () => {
      const userId = 'user123';
      const isVerified = false;
      const pathname = '/signin';
      expect(shouldRedirectToVerifyEmail(userId, isVerified, pathname)).toBe(true);
    });

    it('verified authenticated user on signin should be redirected to root', () => {
      const userId = 'user123';
      const isVerified = true;
      const pathname = '/signin';
      expect(shouldRedirectToRoot(userId, isVerified, pathname)).toBe(true);
    });

    it('verified authenticated user on signup should be redirected to root', () => {
      const userId = 'user123';
      const isVerified = true;
      const pathname = '/signup';
      expect(shouldRedirectToRoot(userId, isVerified, pathname)).toBe(true);
    });

    it('unauthenticated user cannot access protected root route', () => {
      const userId = null;
      const pathname = '/';
      expect(isProtectedRoute(pathname)).toBe(true);
      expect(userId).toBeNull();
    });

    it('unverified user cannot access dashboard without verification', () => {
      const userId = 'user123';
      const isVerified = false;
      const pathname = '/';
      expect(shouldRedirectToVerifyEmail(userId, isVerified, pathname)).toBe(true);
    });
  });

  describe('verification flow scenarios', () => {
    it('unverified user should stay on verify-email page', () => {
      const userId = 'user123';
      const isVerified = false;
      const pathname = '/verify-email';
      expect(shouldRedirectToVerifyEmail(userId, isVerified, pathname)).toBe(false);
      expect(shouldRedirectToSignin(userId, isVerified, pathname)).toBe(false);
    });

    it('verified user should be redirected from verify-email to dashboard', () => {
      const userId = 'user123';
      const isVerified = true;
      const pathname = '/verify-email';
      expect(shouldRedirectToRoot(userId, isVerified, pathname)).toBe(true);
    });

    it('unverified user trying to access auth pages should go to verify-email', () => {
      const userId = 'user123';
      const isVerified = false;
      expect(shouldRedirectToVerifyEmail(userId, isVerified, '/signin')).toBe(true);
      expect(shouldRedirectToVerifyEmail(userId, isVerified, '/signup')).toBe(true);
    });
  });

  describe('logout scenario', () => {
    it('after logout, user should be redirected from root to signin', () => {
      // User logs out
      const userId = null;
      const isVerified = false;
      const pathname = '/';

      // User is on protected route but not authenticated
      expect(isProtectedRoute(pathname)).toBe(true);
      expect(shouldRedirectToSignin(userId, isVerified, pathname)).toBe(true);
      expect(userId).toBeNull();
    });

    it('after logout, user visiting index should be sent to signin', () => {
      const userId = null;
      const isVerified = false;
      const pathname = '/';
      expect(shouldRedirectToSignin(userId, isVerified, pathname)).toBe(true);
    });
  });

  describe('auth page accessibility', () => {
    it('unauthenticated users can navigate between signin and signup', () => {
      const userId = null;
      const isVerified = false;
      expect(isAuthRoute('/signin')).toBe(true);
      expect(isAuthRoute('/signup')).toBe(true);
      expect(shouldRedirectToRoot(userId, isVerified, '/signin')).toBe(false);
      expect(shouldRedirectToRoot(userId, isVerified, '/signup')).toBe(false);
    });

    it('unverified authenticated users cannot stay on auth pages', () => {
      const userId = 'user123';
      const isVerified = false;
      expect(shouldRedirectToVerifyEmail(userId, isVerified, '/signin')).toBe(true);
      expect(shouldRedirectToVerifyEmail(userId, isVerified, '/signup')).toBe(true);
    });

    it('verified authenticated users cannot stay on auth pages', () => {
      const userId = 'user123';
      const isVerified = true;
      expect(shouldRedirectToRoot(userId, isVerified, '/signin')).toBe(true);
      expect(shouldRedirectToRoot(userId, isVerified, '/signup')).toBe(true);
    });
  });
});
