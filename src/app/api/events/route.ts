import { NextResponse } from 'next/server';
import { EventRepository } from '@/lib/repositories/EventRepository';
import { DeploymentRepository } from '@/lib/repositories/DeploymentRepository';
import { InstanceRepository } from '@/lib/repositories/InstanceRepository';

// GET /api/events - Get events by instance ID with pagination
export async function GET(request: Request) {
  try {
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
    
    // Initialize repositories
    const instanceRepo = new InstanceRepository();
    const deploymentRepo = new DeploymentRepository();
    const eventRepo = new EventRepository();
    
    // Verify the instance exists
    const instance = await instanceRepo.findOne({ id: instanceId });
    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' }, 
        { status: 404 }
      );
    }
    
    // Convert pagination params to numbers with defaults
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    // Get deployments for this instance
    const deployments = await deploymentRepo.findByInstance(instanceId);
    
    if (deployments.length === 0) {
      return NextResponse.json({
        page,
        limit,
        total: 0,
        totalPages: 0,
        data: []
      });
    }
    
    // Get deployment IDs
    const deploymentIds = deployments.map(d => d.id);
    
    // Get all events for these deployments
    const allEvents = [];
    for (const deploymentId of deploymentIds) {
      const events = await eventRepo.findByDeployment(deploymentId);
      allEvents.push(...events);
    }
    
    // Sort by created_at in descending order
    allEvents.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Calculate pagination
    const totalItems = allEvents.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Apply pagination
    const paginatedEvents = allEvents.slice(startIndex, endIndex);
    
    return NextResponse.json({
      page,
      limit,
      total: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      data: paginatedEvents
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch events", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 