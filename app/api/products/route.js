import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log("API route hit: /api/products");
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    // Test connection first
    await prisma.$connect();
    console.log("✅ Database connection successful");
    
    // Try to fetch products without filters first to see if the basic query works
    const allProducts = await prisma.product.findMany();
    console.log(`Found ${allProducts.length} total products in database`);
    
    // Then apply the coffee filter if the first query works
    const coffeeProducts = await prisma.product.findMany({
      where: { category: 'coffee' }
    });
    
    console.log(`Found ${coffeeProducts.length} coffee products in database`);
    
    // If we found coffee products, return them
    if (coffeeProducts.length > 0) {
      return NextResponse.json(coffeeProducts);
    }
    
    // If we found general products but no coffee, return all products
    if (allProducts.length > 0) {
      console.log("⚠️ No coffee products found, returning all products instead");
      return NextResponse.json(allProducts);
    }
    
    // No products found at all - return empty array with 200 status
    console.log("⚠️ No products found in database");
    return NextResponse.json([]);
    
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