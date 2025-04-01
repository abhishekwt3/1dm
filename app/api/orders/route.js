// app/api/orders/route.js
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user_name');
    
    if (!userName) {
      return NextResponse.json(
        { error: 'User name is required' },
        { status: 400 }
      );
    }
    
    // Fetch orders for the user
    const orders = await prisma.order.findMany({
      where: { user_name: userName },
      include: {
        order_items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        order_date: 'desc'
      }
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request) {
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    const body = await request.json();
    const { user_name, location, order_items, payment_method, price } = body;
    
    // Validate required fields
    if (!user_name || !order_items || order_items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order information' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const userExists = await prisma.account.findUnique({
      where: { user_name }
    });
    
    if (!userExists) {
      console.log(`User ${user_name} does not exist in the database`);
      
      // For development purposes only
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
    
    // Calculate total price if not provided
    let totalPrice = price;
    if (!totalPrice && order_items.length > 0) {
      totalPrice = order_items.reduce((sum, item) => sum + item.price, 0);
    }
    
    // Create the order
    const newOrder = await prisma.order.create({
      data: {
        user_name,
        location: location || 'Store Location',
        price: totalPrice,
        payment_method: payment_method || 'cod',
        status: 'PENDING',
        order_items: {
          create: order_items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        order_items: true
      }
    });
    
    return NextResponse.json({
      id: newOrder.id,
      message: 'Order created successfully',
      order: newOrder
    }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}