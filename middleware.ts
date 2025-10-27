import { type NextRequest, NextResponse } from 'next/server';

/**
 * Simplified middleware for Edge Runtime compatibility.
 * Authentication will be handled at the page/API level instead.
 */
export async function middleware(request: NextRequest) {
  // Just pass through for now - auth will be handled at page level
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
