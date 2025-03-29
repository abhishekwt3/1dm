// app/api/order/route.js
import { NextResponse } from 'next/server';

// Mock database for orders
// In a real app, this would be a connection to an actual database
let orders = [];

// Helper function to verify authentication
// In a real app, this would validate tokens or session cookies
function isAuthenticated(request) {
  // Get authorization header or cookies
  const authHeader = request.headers.get('authorization');
  
  // This is a very simple mock authentication
  // Real implementation would verify JWT tokens or session cookies
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  // Mock token validation - in production, you'd verify JWT tokens
  return true;
}

// GET handler to fetch orders (for user history)
export async function GET(request) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get query parameters for filtering
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  let userOrders = [...orders];
  
  // Filter by user if userId is provided
  if (userId) {
    userOrders = userOrders.filter(order => order.userId === userId);
  }
  
  return NextResponse.json({ orders: userOrders });
}

// POST handler to create new orders
export async function POST(request) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order: userId and at least one item are required' }, 
        { status: 400 }
      );
    }
    
    // Create new order with a generated ID and timestamp
    const newOrder = {
      id: Date.now().toString(), // Simple ID generation
      userId: body.userId,
      items: body.items,
      totalAmount: body.totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Save order to our mock database
    orders.push(newOrder);
    
    return NextResponse.json({ 
      message: 'Order created successfully', 
      order: newOrder 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to process order' }, 
      { status: 500 }
    );
  }
}

// PATCH handler to update order status
export async function PATCH(request) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.orderId || !body.status) {
      return NextResponse.json(
        { error: 'Invalid update: orderId and status are required' }, 
        { status: 400 }
      );
    }
    
    // Find the order to update
    const orderIndex = orders.findIndex(order => order.id === body.orderId);
    
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }
    
    // Update the order status
    orders[orderIndex].status = body.status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    return NextResponse.json({ 
      message: 'Order updated successfully', 
      order: orders[orderIndex] 
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' }, 
      { status: 500 }
    );
  }
}

// DELETE handler to cancel an order
export async function DELETE(request) {
  // Check authentication
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get order ID from URL parameters
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' }, 
        { status: 400 }
      );
    }
    
    // Find the order to delete/cancel
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' }, 
        { status: 404 }
      );
    }
    
    // Only allow cancellation of pending orders
    if (orders[orderIndex].status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending orders can be cancelled' }, 
        { status: 400 }
      );
    }
    
    // Remove the order from our mock database
    // In a real app, you might just mark it as cancelled instead
    const cancelledOrder = orders[orderIndex];
    orders.splice(orderIndex, 1);
    
    return NextResponse.json({ 
      message: 'Order cancelled successfully', 
      order: cancelledOrder 
    });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' }, 
      { status: 500 }
    );
  }
}