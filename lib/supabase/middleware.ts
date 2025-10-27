import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for use in Next.js middleware.
 * This client handles session refresh and cookie management for authentication.
 *
 * This function should be called in your middleware.ts file to ensure
 * that user sessions are kept fresh across route changes.
 *
 * @param request - The Next.js request object
 * @returns Object containing the response and supabase client
 *
 * @example
 * ```ts
 * // In middleware.ts
 * import { updateSession } from '@/lib/supabase/middleware';
 * import { NextResponse } from 'next/server';
 * import type { NextRequest } from 'next/server';
 *
 * export async function middleware(request: NextRequest) {
 *   const { response, supabase } = await updateSession(request);
 *
 *   // Optional: Add custom middleware logic
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 *   if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 *
 *   return response;
 * }
 *
 * export const config = {
 *   matcher: [
 *     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
 *   ],
 * };
 * ```
 */
export async function updateSession(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optionally handle authentication redirects here
  // Example: Redirect to login if user is not authenticated
  // if (!user && !request.nextUrl.pathname.startsWith('/login')) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/login';
  //   return NextResponse.redirect(url);
  // }

  return { response, supabase, user };
}

/**
 * Helper function to create protected routes in middleware.
 * Redirects unauthenticated users to the login page.
 *
 * @param request - The Next.js request object
 * @param loginUrl - Optional custom login URL (defaults to '/login')
 * @returns NextResponse
 *
 * @example
 * ```ts
 * // In middleware.ts
 * import { requireAuth } from '@/lib/supabase/middleware';
 *
 * export async function middleware(request: NextRequest) {
 *   if (request.nextUrl.pathname.startsWith('/dashboard')) {
 *     return requireAuth(request);
 *   }
 * }
 * ```
 */
export async function requireAuth(request: NextRequest, loginUrl = '/login') {
  const { response, user } = await updateSession(request);

  if (!user) {
    const redirectUrl = new URL(loginUrl, request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
