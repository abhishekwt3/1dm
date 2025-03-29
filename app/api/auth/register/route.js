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
    const { user_name, email, password, full_name } = await request.json();
    
    // Validate required fields
    if (!user_name || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if username or email already exists
    const existingUser = await prisma.account.findFirst({
      where: {
        OR: [
          { user_name },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      );
    }
    
    // Create new account
    // NOTE: In production, always hash passwords before storing them
    const newAccount = await prisma.account.create({
      data: {
        user_name,
        email,
        password, // In production, hash this!
        full_name: full_name || user_name,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: newAccount.id,
        username: newAccount.user_name
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
    
    // Return success with token
    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: newAccount.id,
        user_name: newAccount.user_name,
        email: newAccount.email,
        full_name: newAccount.full_name,
      },
      token
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}