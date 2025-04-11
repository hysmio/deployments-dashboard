import { NextResponse } from 'next/server';
import { DeploymentService } from '@/lib/services/DeploymentService';

// GET /api/stats/deployments - Get deployment statistics for a service
export async function GET(request: Request) {
  try {
    const deploymentService = new DeploymentService();
    
    const { searchParams } = new URL(request.url);
    const serviceName = searchParams.get('service');
    const daysParam = searchParams.get('days');
    
    if (!serviceName) {
      return NextResponse.json(
        { error: 'Service name is required' }, 
        { status: 400 }
      );
    }
    
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    
    const stats = await deploymentService.countRecentDeploymentsByStatus(serviceName, days);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching deployment stats:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch deployment statistics", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 