import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * OAuth callback route handler.
 * Handles authentication callbacks from Supabase (email confirmation, magic links, OAuth providers).
 *
 * This route is called by Supabase after:
 * - Email confirmation
 * - Magic link authentication
 * - OAuth provider authentication
 * - Password reset confirmation
 *
 * @param request - The Next.js request object containing auth code
 * @returns Redirect response to the appropriate page
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      // Successful authentication - redirect to the requested page
      return NextResponse.redirect(new URL(next, request.url));
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(
        new URL('/login?error=An unexpected error occurred', request.url)
      );
    }
  }

  // No code present, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}
