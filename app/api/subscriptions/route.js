import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// GET endpoint to fetch subscriptions with optional username query parameter
export async function GET(request) {
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    // Get the URL to extract query parameters
    const { searchParams } = new URL(request.url);
    
    // Extract username from query parameters or use default
    const userName = searchParams.get('user_name') || "current_user";
    
    console.log(`Getting subscriptions for user: ${userName}`);
    await prisma.$connect();
    
    const subscriptions = await prisma.subscription.findMany({
      where: { user_name: userName },
      include: {
        equipment: true
      },
      orderBy: {
        start_date: 'desc'
      }
    });
    
    console.log(`Found ${subscriptions.length} subscriptions for user ${userName}`);
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Subscriptions fetch error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'info'],
  });
  
  try {
    const body = await request.json();
    console.log("Creating subscription with data:", body);
    
    // Extract data from request
    const { 
      user_name, 
      equipment_id, 
      subscription_type, 
      pickup_location, 
      drop_location, 
      deposit, 
      price
    } = body;
    
    // Validate required fields
    if (!user_name || !equipment_id || !subscription_type || !pickup_location || !drop_location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if user exists first - this is critical to avoid foreign key errors
    const userExists = await prisma.account.findUnique({
      where: { user_name }
    });
    
    if (!userExists) {
      console.log(`User ${user_name} does not exist in the database`);
      
      // For development purposes, create a test user if it doesn't exist
      if (process.env.NODE_ENV === 'development') {
        console.log(`Creating test user ${user_name} for development`);
        
        try {
          await prisma.account.create({
            data: {
              user_name,
              email: `${user_name}@example.com`,
              password: "password123", // This would be hashed in production
              full_name: user_name,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          console.log(`Test user ${user_name} created successfully`);
        } catch (createError) {
          console.error("Failed to create test user:", createError);
          return NextResponse.json(
            { error: `User ${user_name} does not exist and could not be created` },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `User ${user_name} not found` },
          { status: 404 }
        );
      }
    }
    
    // Check if equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipment_id }
    });
    
    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 }
      );
    }
    
    // Calculate end date based on subscription type
    const start_date = new Date();
    let end_date = null;
    
    if (subscription_type === 'WEEKLY') {
      end_date = new Date(start_date);
      end_date.setDate(end_date.getDate() + 7);
    } else if (subscription_type === 'MONTHLY') {
      end_date = new Date(start_date);
      end_date.setMonth(end_date.getMonth() + 1);
    }
    
    // Create the subscription with only the fields that exist in the schema
    const subscription = await prisma.subscription.create({
      data: {
        user_name,
        equipment_id,
        start_date,
        end_date,
        deposit,
        pickup_location,
        drop_location,
        price,
        subscription_type,
        status: 'ACTIVE'
      }
    });
    
    console.log("Subscription created successfully:", subscription.id);
    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Subscription creation error:", error);
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}