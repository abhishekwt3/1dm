import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Next.js uses jose for JWT in middleware

// Secret key should be in .env file
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file'
);

// Define which routes require authentication
const protectedRoutes = [
  '/api/account',
  '/api/orders',
  '/api/subscriptions',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if this route should be protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    // No token found, send unauthorized response
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
  
  try {
    // Verify the token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check if token is expired
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    if (Date.now() > expirationTime) {
      return new NextResponse(
        JSON.stringify({ error: 'Token expired' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // Token is valid, attach user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-name', payload.username);
    
    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
  } catch (error) {
    // Invalid token
    console.error('Token verification error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
}

export const config = {
  matcher: [
    '/api/account/:path*',
    '/api/orders/:path*',
    '/api/subscriptions/:path*',
  ],
};