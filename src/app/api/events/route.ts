import { NextResponse } from 'next/server';
import { getEventsByInstance } from '@/lib/data';

// GET /api/events - Get events by instance ID with pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get('instanceId');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  
  if (!instanceId) {
    return NextResponse.json(
      { error: 'Instance ID is required' }, 
      { status: 400 }
    );
  }
  
  // Convert pagination params to numbers with defaults
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  
  const events = getEventsByInstance(instanceId);
  
  // Sort events chronologically, most recent first
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // Calculate pagination
  const totalItems = sortedEvents.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Apply pagination
  const paginatedEvents = sortedEvents.slice(startIndex, endIndex);
  
  return NextResponse.json({
    page,
    limit,
    total: totalItems,
    totalPages: Math.ceil(totalItems / limit),
    data: paginatedEvents
  });
} 