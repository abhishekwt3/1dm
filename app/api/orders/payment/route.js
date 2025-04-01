// app/api/orders/payment/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Test keys - replace with your actual test keys from Razorpay dashboard
const RAZORPAY_KEY_ID = 'rzp_test_hUQo4F5shW6rH4';
const RAZORPAY_KEY_SECRET = 'X9FAH8ZZyMu2w0cd1SqVi1dF';

export async function POST(request) {
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    const body = await request.json();
    const { 
      user_name, 
      location, 
      order_items, 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = body;
    
    if (!user_name || !order_items || order_items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order information' },
        { status: 400 }
      );
    }
    
    // Calculate total price
    const totalPrice = order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create the order
    const newOrder = await prisma.order.create({
      data: {
        user_name,
        location: location || 'Store Location',
        price: totalPrice,
        payment_method: 'online',
        status: 'PENDING',
        payment_id: razorpay_payment_id,
        order_items: {
          create: order_items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price * item.quantity
          }))
        }
      },
      include: {
        order_items: true
      }
    });
    
    // If this is a Razorpay payment, update the payment status
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      // In a real implementation, you would verify the signature here
      
      // Update the order with payment details
      await prisma.order.update({
        where: { id: newOrder.id },
        data: {
          payment_status: 'PAID',
          status: 'PROCESSING'
        }
      });
    }
    
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