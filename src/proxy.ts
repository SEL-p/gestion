import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files and API routes that are public
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }

  // Read the auth_role cookie
  const authRole = request.cookies.get('auth_role')?.value;

  // If user is not logged in and not already on the login page, redirect to login
  if (!authRole && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is already logged in and tries to access login, redirect to appropriate home
  if (authRole && pathname === '/login') {
    if (authRole === 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    } else {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
  }

  // Cashier specific logic:
  // A cashier can ONLY access /pos and /api/... routes
  if (authRole === 'cashier') {
    if (pathname !== '/pos' && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
  }

  // Admin has access to everything
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
