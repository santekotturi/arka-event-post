import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-key-at-least-32-characters-long'
);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect dashboard route
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token');

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await jwtVerify(token.value, secret);
      return NextResponse.next();
    } catch {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from login
  if (pathname === '/login') {
    const token = request.cookies.get('auth-token');
    
    if (token) {
      try {
        await jwtVerify(token.value, secret);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Invalid token, allow access to login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login']
};