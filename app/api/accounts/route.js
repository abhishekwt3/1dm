import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  // In a real app, get the user from the session
  const userName = "current_user";
  console.log(`API route hit: /api/account - getting data for ${userName}`);
  
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful");
    
    // First check if the account exists
    const account = await prisma.account.findUnique({
      where: { user_name: userName }
    });
    
    if (!account) {
      console.log(`❌ Account not found for username: ${userName}`);
      
      // For development, create a test account if one doesn't exist
      if (process.env.NODE_ENV === 'development') {
        console.log("🔧 Creating development test account");
        
        try {
          const newAccount = await prisma.account.create({
            data: {
              user_name: userName,
              email: "test@example.com",
              password: "password123", // In a real app, this would be hashed
              full_name: "Test User",
              member: false,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          
          console.log("✅ Test account created successfully");
          return NextResponse.json(newAccount);
          
        } catch (createError) {
          console.error("❌ Failed to create test account:", createError);
          return NextResponse.json(
            { error: 'User not found and could not create test account' },
            { status: 404 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log("✅ Account found:", account.user_name);
    
    // Don't return the password in the response
    const { password, ...safeAccount } = account;
    return NextResponse.json(safeAccount);
    
  } catch (error) {
    console.error("❌ Database error:", error);
    
    return NextResponse.json(
      { 
        error: 'Database error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request) {
  // In a real app, get the user from the session
  const userName = "current_user";
  console.log(`API route hit: PUT /api/account - updating data for ${userName}`);
  
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    const body = await request.json();
    console.log("📝 Update data received:", body);
    
    // Extract the fields we allow to be updated
    const { full_name, email, phone_number, address } = body;
    
    // Check if the account exists
    const existingAccount = await prisma.account.findUnique({
      where: { user_name: userName }
    });
    
    if (!existingAccount) {
      console.log(`❌ Cannot update non-existent account: ${userName}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update the account
    const updatedAccount = await prisma.account.update({
      where: { user_name: userName },
      data: {
        full_name,
        email,
        phone_number,
        address,
        updated_at: new Date()
      }
    });
    
    console.log("✅ Account updated successfully");
    
    // Don't return the password in the response
    const { password, ...safeAccount } = updatedAccount;
    return NextResponse.json(safeAccount);
    
  } catch (error) {
    console.error("❌ Update error:", error);
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint violation. Email may already be in use.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update account', 
        message: error.message 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}