import { NextResponse } from 'next/server';
import { getAllServices, getServiceByName } from '@/lib/data';

// GET /api/services - Get all services
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  
  if (name) {
    const service = getServiceByName(name);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json(service);
  }
  
  const services = getAllServices();
  return NextResponse.json(services);
} 