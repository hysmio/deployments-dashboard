import { NextResponse } from 'next/server';
import { ServiceRepository } from '@/lib/repositories/ServiceRepository';

// GET /api/services - Get all services
export async function GET(request: Request) {
  try {
    const serviceRepo = new ServiceRepository();
    
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (name) {
      const service = await serviceRepo.findOne({ name });
      if (!service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      return NextResponse.json(service);
    }
    
    const services = await serviceRepo.findAll();
    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch services", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 