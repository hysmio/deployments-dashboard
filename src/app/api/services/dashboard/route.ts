import { NextResponse } from 'next/server';
import { ServiceRepository } from '@/lib/repositories/ServiceRepository';
import { InstanceRepository } from '@/lib/repositories/InstanceRepository';
import { DeploymentRepository } from '@/lib/repositories/DeploymentRepository';
import { EventRepository } from '@/lib/repositories/EventRepository';
import { ServiceWithData } from '@/lib/types/service';
import { Instance } from '@/lib/models/instance';
import { Deployment } from '@/lib/models/deployment';
import { Event } from '@/lib/models/event';

// Define types to improve type safety
type DeploymentWithEvents = {
  deployment: Deployment;
  events: Event[];
};

type InstanceWithDeployments = {
  instance: Instance;
  latestDeployment: DeploymentWithEvents | null;
};

// GET /api/services/dashboard - Get all services with their instances and deployment information
export async function GET(request: Request) {
  try {
    const serviceRepo = new ServiceRepository();
    const instanceRepo = new InstanceRepository();
    const deploymentRepo = new DeploymentRepository();
    const eventRepo = new EventRepository();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // --- STEP 1: Get all services in a single query ---
    const services = await serviceRepo.findAll();
    
    // --- STEP 2: Get all instances for all services in a single batch query ---
    const allInstances = await instanceRepo.findAll();
    
    // Group instances by service name for easy lookup
    const instancesByService = allInstances.reduce<Record<string, Instance[]>>((acc, instance) => {
      if (!acc[instance.service]) {
        acc[instance.service] = [];
      }
      acc[instance.service].push(instance);
      return acc;
    }, {});
    
    // --- STEP 3: Get all instance IDs for upcoming batch queries ---
    const allInstanceIds = allInstances.map(instance => instance.id);
    
    // --- STEP 4: Batch fetch the latest deployment for each instance ---
    const latestDeployments = await deploymentRepo.findLatestSince(startDate);
    
    // Group deployments by instance ID
    const deploymentsByInstance: Record<string, Deployment> = {};
    latestDeployments.forEach(deployment => {
      deploymentsByInstance[deployment.instance_id] = deployment;
    });
    
    // --- STEP 5: Collect all deployment IDs to fetch events in batch ---
    const allDeploymentIds = latestDeployments.map(deployment => deployment.id);
    
    // --- STEP 6: Batch fetch events for all deployments ---
    const allEvents = await eventRepo.findSince(startDate);
    
    // Group events by deployment ID
    const eventsByDeployment = allEvents.reduce<Record<string, Event[]>>((acc, event) => {
      if (!acc[event.deployment_id]) {
        acc[event.deployment_id] = [];
      }
      acc[event.deployment_id].push(event);
      return acc;
    }, {});
    
    // --- STEP 7: Batch fetch deployment stats ---
    const deploymentStats = await deploymentRepo.countRecentByInstancesAndStatus(startDate);
    
    // --- STEP 8: Assemble the response data for each service ---
    const servicesWithData: ServiceWithData[] = services.map(service => {
      // Get instances for this service
      const instances = instancesByService[service.name] || [];
      
      // Get the prod instance if it exists
      const prodInstance = instances.find(i => i.environment === 'prod');
      
      // Last prod deployment info
      let prodDeploymentData = null;
      
      if (prodInstance) {
        const prodDeployment = deploymentsByInstance[prodInstance.id];
        
        if (prodDeployment) {
          const deploymentEvents = eventsByDeployment[prodDeployment.id] || [];
          const successEvent = deploymentEvents.find(e => e.event_type === 'deployment_succeeded');
          const startEvent = deploymentEvents.find(e => e.event_type === 'deployment_started');
          
          if (successEvent && startEvent) {
            // Extract commit info using type assertion
            const eventData = startEvent.event_data as {
              commit_message?: string;
              commit_author?: string;
              commit?: string;
              buildkite_build_url?: string;
            };
            
            prodDeploymentData = {
              id: prodDeployment.id,
              created_at: successEvent.created_at,
              event_type: successEvent.event_type,
              buildkite_url: eventData.buildkite_build_url,
              commitInfo: {
                message: eventData.commit_message,
                author: eventData.commit_author,
                shortCommit: eventData.commit?.substring(0, 7),
                commit: eventData.commit,
              }
            };
          }
        }
      }
      
      // Recent activity info
      let recentActivityData = null;
      
      // Get the first instance for recent activity
      const firstInstance = instances[0];
      if (firstInstance) {
        const latestDeployment = deploymentsByInstance[firstInstance.id];
        
        if (latestDeployment) {
          const deploymentEvents = eventsByDeployment[latestDeployment.id] || [];
          const latestEvent = deploymentEvents[0]; // Events were returned in created_at DESC order
          
          if (latestEvent) {
            recentActivityData = {
              id: latestEvent.id,
              created_at: latestEvent.created_at,
              event_type: latestEvent.event_type,
              deployment_id: latestEvent.deployment_id,
              environment: firstInstance.environment
            };
          }
        }
      }
      
      // Get aggregated deployment stats for this service's instances
      const serviceInstanceIds = instances.map(instance => instance.id);
      const stats = { succeeded: 0, failed: 0 };
      
      serviceInstanceIds.forEach(instanceId => {
        if (deploymentStats[instanceId]) {
          stats.succeeded += deploymentStats[instanceId].succeeded || 0;
          stats.failed += deploymentStats[instanceId].failed || 0;
        }
      });
      
      return {
        ...service,
        instances: instances.map(instance => ({
          id: instance.id,
          name: instance.name,
          environment: instance.environment
        })),
        instanceCount: instances.length,
        prodDeployment: prodDeploymentData,
        recentActivity: recentActivityData,
        deploymentStats: stats
      };
    });
    
    return NextResponse.json(servicesWithData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred while fetching the dashboard data',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
} 