import { NextResponse } from 'next/server';
import { EventRepository } from '@/lib/repositories/EventRepository';

// GET /api/events/find-start - Find the start event for a deployment
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const completionEventId = searchParams.get('completionEventId');
    
    if (!completionEventId) {
      return NextResponse.json(
        { error: 'Completion event ID is required' },
        { status: 400 }
      );
    }
    
    const eventRepo = new EventRepository();
    
    // First get the completion event
    const completionEvent = await eventRepo.findOne({ id: completionEventId });
    
    if (!completionEvent) {
      return NextResponse.json(
        { error: 'Completion event not found' },
        { status: 404 }
      );
    }
    
    // Find the start event for the same deployment
    const startEvent = await eventRepo.findLatestByDeploymentAndType(
      completionEvent.deployment_id,
      'deployment_started'
    );
    
    if (!startEvent) {
      return NextResponse.json(
        { error: 'Start event not found for this deployment' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(startEvent);
  } catch (error) {
    console.error('Error finding start event:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred while finding the start event',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
} 