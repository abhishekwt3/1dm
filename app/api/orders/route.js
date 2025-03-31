import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// GET endpoint to fetch orders with optional username query parameter
export async function GET(request) {
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    // Get the URL to extract query parameters
    const { searchParams } = new URL(request.url);
    
    // Extract username from query parameters or use default
    const userName = searchParams.get('user_name') || "current_user";
    
    console.log(`Getting orders for user: ${userName}`);
    await prisma.$connect();
    
    const orders = await prisma.order.findMany({
      where: { user_name: userName },
      include: {
        order_items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        order_date: 'desc'
      }
    });
    
    console.log(`Found ${orders.length} orders for user ${userName}`);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Orders fetch error:", error);
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
    console.log("Creating order with data:", body);
    
    // Extract data from request
    const { 
      user_name, 
      location, 
      payment_method,
      delivery_notes,
      items,
      total_price
    } = body;
    
    // Validate required fields
    if (!user_name || !location || !items || items.length === 0) {
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
    
    // Check if all products exist and are available
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id }
      });
      
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.product_id} not found` },
          { status: 404 }
        );
      }
      
      if (!product.available) {
        return NextResponse.json(
          { error: `Product ${product.product_name} is currently unavailable` },
          { status: 400 }
        );
      }
    }
    
    // Calculate total price if not provided
    let price = total_price;
    if (!price) {
      price = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // Create the order using a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the order first
      const order = await tx.order.create({
        data: {
          user_name,
          location,
          price,
          payment_method,
          delivery_notes,
          status: 'PENDING',
        }
      });
      
      // Create order items
      const orderItemPromises = items.map(item => 
        tx.orderItem.create({
          data: {
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          }
        })
      );
      
      const orderItems = await Promise.all(orderItemPromises);
      
      return { order, orderItems };
    });
    
    console.log("Order created successfully:", result.order.id);
    return NextResponse.json({ 
      message: 'Order created successfully',
      order: result.order,
      order_items: result.orderItems 
    }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH endpoint to update order status
export async function PATCH(request) {
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    const body = await request.json();
    console.log("Updating order with data:", body);
    
    // Extract data from request
    const { order_id, status } = body;
    
    // Validate required fields
    if (!order_id || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }
    
    // Validate status is a valid enum value
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: order_id },
      data: { status },
    });
    
    console.log(`Order ${order_id} status updated to ${status}`);
    return NextResponse.json({ 
      message: 'Order status updated successfully',
      order: updatedOrder 
    });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { 
        error: 'Failed to update order',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}