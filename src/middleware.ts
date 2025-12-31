import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect authenticated users away from auth pages
    if (token && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Check for B2B-only routes
    if (pathname.startsWith('/workspace') && token?.userType !== 'B2B') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes
        const publicRoutes = ['/', '/login', '/signup', '/verify-email', '/forgot-password'];
        if (publicRoutes.some((route) => pathname === route)) {
          return true;
        }

        // API routes that don't require auth
        if (pathname.startsWith('/api/auth')) {
          return true;
        }

        // Marketplace browsing is public (GET only)
        if (pathname === '/api/marketplace/templates') {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads folder (public assets)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads|public).*)',
  ],
};
