import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_JWT_SECRET || "please_set_a_secret"
);

const PROTECTED_PATHS = [
  '/admin'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets, API, and _next
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if path is protected
  const isProtected = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  // Allow the admin login page to be public
  if (pathname === '/admin/login') return NextResponse.next();

  // Validate JWT from cookie
  try {
    const cookie = request.cookies.get('scum_auth');
    if (cookie?.value) {
      const token = cookie.value;
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.next(); // Token is valid, proceed
      } catch (e) {
        // Invalid token, fall through to redirect
        console.log('Invalid token in middleware:', e);
      }
    }
  } catch (err) {
    console.error('Middleware auth check error:', err);
  }

  // Redirect to admin login
  const loginUrl = new URL('/admin/login', request.nextUrl.origin);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*']
};
