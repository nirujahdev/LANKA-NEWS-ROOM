import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root path to language-specific homepage
  if (pathname === '/') {
    // Only use cookie if exists, otherwise default to 'en'
    // Do NOT auto-detect from browser language - user must manually switch
    const langCookie = request.cookies.get('preferredLanguage')?.value;
    
    let detectedLang = 'en';
    if (langCookie && ['en', 'si', 'ta'].includes(langCookie)) {
      detectedLang = langCookie;
    }
    
    const response = NextResponse.redirect(new URL(`/${detectedLang}`, request.url));
    // Set cookie for future requests
    response.cookies.set('preferredLanguage', detectedLang, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax'
    });
    return response;
  }

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
  matcher: ['/', '/for-you/:path*', '/onboarding/:path*', '/profile/:path*', '/auth/callback/:path*']
};

