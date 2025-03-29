import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log("API route hit: /api/equipment");
  const prisma = new PrismaClient({
    log: ['query', 'error'],
  });
  
  try {
    // Test connection first
    await prisma.$connect();
    console.log("✅ Database connection successful");
    
    // Try to fetch all equipment first
    const allEquipment = await prisma.equipment.findMany();
    console.log(`Found ${allEquipment.length} total equipment items in database`);
    
    // Then apply the available filter
    const availableEquipment = await prisma.equipment.findMany({
      where: { available: true }
    });
    
    console.log(`Found ${availableEquipment.length} available equipment items in database`);
    
    // If we found available equipment, return it
    if (availableEquipment.length > 0) {
      return NextResponse.json(availableEquipment);
    }
    
    // If we found equipment but none available, return all equipment
    if (allEquipment.length > 0) {
      console.log("⚠️ No available equipment found, returning all equipment instead");
      return NextResponse.json(allEquipment);
    }
    
    // No equipment found at all - return empty array with 200 status
    console.log("⚠️ No equipment found in database");
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