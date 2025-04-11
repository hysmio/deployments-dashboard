import { NextResponse } from 'next/server';
import { DeploymentRepository } from '@/lib/repositories/DeploymentRepository';
import { InstanceRepository } from '@/lib/repositories/InstanceRepository';

export async function GET(
  request: Request,
) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (!id) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }
    
    const deploymentRepo = new DeploymentRepository();
    const instanceRepo = new InstanceRepository();
    
    // Find the deployment
    const deployment = await deploymentRepo.findOne({ id });
    
    if (!deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }
    
    // Get the instance to include environment info
    const instance = await instanceRepo.findOne({ id: deployment.instance_id });
    
    // Return deployment with environment information
    return NextResponse.json({
      ...deployment,
      environment: instance?.environment || 'unknown'
    });
  } catch (error) {
    console.error('Error fetching deployment:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred while fetching the deployment',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
} 