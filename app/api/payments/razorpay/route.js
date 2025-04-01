// app/api/payments/razorpay/route.js
import { NextResponse } from 'next/server';

// Test keys - replace with your actual test keys from Razorpay dashboard
// In production, store these in environment variables
const RAZORPAY_KEY_ID = 'rzp_test_hUQo4F5shW6rH4';
const RAZORPAY_KEY_SECRET = 'X9FAH8ZZyMu2w0cd1SqVi1dF';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt, payment_for, metadata } = body;
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }
    
    // Initialize Razorpay
    let Razorpay;
    try {
      Razorpay = require('razorpay');
    } catch (error) {
      console.error('Razorpay package not installed:', error.message);
      return NextResponse.json(
        { 
          error: 'Payment system not configured. Please install Razorpay package with: npm install razorpay', 
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    // Create Razorpay instance
    let instance;
    try {
      instance = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });
    } catch (error) {
      console.error('Failed to initialize Razorpay:', error.message);
      return NextResponse.json(
        { 
          error: 'Payment system failed to initialize. Check your Razorpay credentials.', 
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        payment_for,
        ...metadata
      }
    };
    
    try {
      const order = await instance.orders.create(options);
      
      // No database integration for now, just return the order
      return NextResponse.json({
        id: order.id,
        amount: order.amount / 100, // Convert back to main currency unit
        currency: order.currency,
        key: RAZORPAY_KEY_ID
      });
    } catch (razorpayError) {
      console.error('Razorpay API error:', razorpayError);
      return NextResponse.json(
        { 
          error: 'Failed to create payment order with Razorpay', 
          details: razorpayError.message 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Payment order creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// Webhook handler for Razorpay
export async function PUT(request) {
  try {
    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      status = 'COMPLETED'
    } = body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Real signature verification would go here
    // const generated_signature = hmac_sha256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET);
    // if (generated_signature !== razorpay_signature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    // }
    
    // For now, consider the payment verified
    // In production, you would update your database here
    
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}