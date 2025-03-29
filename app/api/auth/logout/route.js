import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  
  // Clear the authentication cookie
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
    sameSite: 'strict'
  });
  
  return NextResponse.json({ message: 'Logged out successfully' });
}