import { NextResponse } from 'next/server';
import { 
  countRecentDeployments, 
  countDeploymentsByService,
  countInstancesByEnvironment
} from '@/lib/data';

// GET /api/stats - Get service statistics
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceName = searchParams.get('service');
  const timeRangeParam = searchParams.get('days');
  
  if (!serviceName) {
    return NextResponse.json(
      { error: 'Service name is required' }, 
      { status: 400 }
    );
  }
  
  const days = timeRangeParam ? parseInt(timeRangeParam, 10) : 30;
  
  const stats = {
    recentDeployments: countRecentDeployments(serviceName, days),
    totalDeployments: countDeploymentsByService(serviceName),
    instancesByEnvironment: countInstancesByEnvironment(serviceName)
  };
  
  return NextResponse.json(stats);
} 