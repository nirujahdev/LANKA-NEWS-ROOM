import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/for-you', '/onboarding', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Allow auth callback
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  // For protected routes, we'll check auth in the page component
  // since middleware can't easily check Supabase session
  // The pages themselves will redirect if not authenticated
  return NextResponse.next();
}

export const config = {
  matcher: ['/for-you/:path*', '/onboarding/:path*', '/profile/:path*', '/auth/callback/:path*']
};

