import { NextResponse } from 'next/server';
import { InstanceRepository } from '@/lib/repositories/InstanceRepository';
import { DeploymentService } from '@/lib/services/DeploymentService';

// GET /api/deployments - Get deployments with filters and pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get('instanceId');
  const serviceName = searchParams.get('service');
  const environment = searchParams.get('environment');
  const buildUrl = searchParams.get('buildkite_build_url');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  
  // Convert pagination params to numbers with defaults
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  
  const deploymentService = new DeploymentService();
  const instanceRepo = new InstanceRepository();
  let deployments = [];
  
  try {
    // Get deployments based on provided parameters
    if (instanceId) {
      // Verify the instance exists
      const instance = await instanceRepo.findOne({ id: instanceId });
      if (!instance) {
        return NextResponse.json(
          { error: 'Instance not found' }, 
          { status: 404 }
        );
      }
      deployments = await deploymentService.getDeploymentsByInstance(instanceId);
    } else if (serviceName && environment) {
      deployments = await deploymentService.getDeploymentsByEnvironment(serviceName, environment);
    } else if (serviceName) {
      deployments = await deploymentService.getDeploymentsByService(serviceName);
    } else {
      return NextResponse.json(
        { error: 'At least one filter parameter is required (instanceId, service)' }, 
        { status: 400 }
      );
    }
    
    // Additional filtering by build URL if provided
    if (buildUrl) {
      deployments = deployments.filter(d => d.buildkite_build_url === buildUrl);
    }
    
    // Calculate pagination
    const totalItems = deployments.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Apply pagination
    const paginatedDeployments = deployments.slice(startIndex, endIndex);
    
    return NextResponse.json({
      page,
      limit,
      total: totalItems,
      totalPages: Math.ceil(totalItems / limit),
      data: paginatedDeployments
    });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching deployments' }, 
      { status: 500 }
    );
  }
} 