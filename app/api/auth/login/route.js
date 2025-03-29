import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Secret key should be in .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';

export async function POST(request) {
  const prisma = new PrismaClient({
    log: ['error'],
  });
  
  try {
    const { user_name, password } = await request.json();
    
    if (!user_name || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Find the user account
    const account = await prisma.account.findUnique({
      where: { user_name }
    });
    
    if (!account) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // In a real application, use bcrypt to compare hashed passwords
    // For this example, we'll do a simple comparison
    // NOTE: In production, always use proper password hashing (bcrypt, etc.)
    const isPasswordValid = account.password === password;
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: account.id,
        username: account.user_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set HTTP-only cookie for enhanced security
    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
      sameSite: 'strict'
    });
    
    // Also return token in response for client-side storage
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: account.id,
        user_name: account.user_name,
        email: account.email,
        full_name: account.full_name,
      },
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}