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
    // Set cookie for future requests to match the URL
    response.cookies.set('preferredLanguage', detectedLang, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax'
    });
    return response;
  }

  // Redirect legacy routes to new format
  // Legacy: /{lang}/topic/{topic} -> /{lang}/{topic}
  if (pathname.match(/^\/(en|si|ta)\/topic\//)) {
    const [, lang, , topic] = pathname.split('/');
    return NextResponse.redirect(new URL(`/${lang}/${topic}`, request.url), 301);
  }

  // Legacy: /{lang}/story/{slug} -> /{lang}/other/{slug} (or detect topic from database)
  if (pathname.match(/^\/(en|si|ta)\/story\//)) {
    const [, lang, , slug] = pathname.split('/');
    // Default to 'other' topic - actual topic will be determined by the page component
    return NextResponse.redirect(new URL(`/${lang}/other/${slug}`, request.url), 301);
  }

  // Sync cookie with URL language for language-aware routes
  const langMatch = pathname.match(/^\/(en|si|ta)(\/|$)/);
  if (langMatch) {
    const urlLang = langMatch[1];
    const langCookie = request.cookies.get('preferredLanguage')?.value;
    
    // If cookie doesn't match URL, update it
    if (langCookie !== urlLang) {
      const response = NextResponse.next();
      response.cookies.set('preferredLanguage', urlLang, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax'
      });
      return response;
    }
  }

  // Protected routes
  const protectedRoutes = ['/for-you', '/onboarding', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Allow auth callback and error pages
  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/auth/error')) {
    return NextResponse.next();
  }

  // For protected routes, store the intended destination
  if (isProtectedRoute) {
    const response = NextResponse.next();
    // Store the intended destination in a cookie for post-auth redirect
    response.cookies.set('auth_redirect', pathname, {
      maxAge: 60 * 5, // 5 minutes
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // Need to read from client side
    });
    return response;
  }

  // For protected routes, we'll check auth in the page component
  // since middleware can't easily check Supabase session
  // The pages themselves will redirect if not authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/for-you/:path*',
    '/onboarding/:path*',
    '/profile/:path*',
    '/auth/callback/:path*',
    '/(en|si|ta)/:path*' // Match all language routes
  ]
};

