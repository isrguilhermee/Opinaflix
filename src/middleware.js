import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/review',
    '/profile/:path*',
    '/api/reviews',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/user/check-admin',
  ],
}; 