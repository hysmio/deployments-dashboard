import { NextResponse } from 'next/server';
import { InstanceRepository } from '@/lib/repositories/InstanceRepository';

// GET /api/instances - Get all instances with optional filtering and pagination
export async function GET(request: Request) {
  try {
    const instanceRepo = new InstanceRepository();
    
    const { searchParams } = new URL(request.url);
    const serviceParam = searchParams.get('service');
    const idParam = searchParams.get('id');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    // Convert pagination params to numbers with defaults
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    if (idParam) {
      const instance = await instanceRepo.findOne({ id: idParam });
      if (!instance) {
        return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
      }
      return NextResponse.json(instance);
    }
    
    const instances = serviceParam 
      ? await instanceRepo.findByService(serviceParam)
      : await instanceRepo.findAll();
    
    // Calculate pagination
    const totalItems = instances.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Apply pagination
    const paginatedInstances = instances.slice(startIndex, endIndex);
    
    return NextResponse.json({
      page,
      limit,
      total: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      data: paginatedInstances
    });
  } catch (error) {
    console.error("Error fetching instances:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch instances", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 