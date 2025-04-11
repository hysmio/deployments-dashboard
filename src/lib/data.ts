import { Instance } from './models/instance';
import { Service } from './models/service';
import { Event } from './models/event';
import { Deployment } from './models/deployment';
import { initializeDB } from './db';
import { Repository, In, LessThan, MoreThan } from 'typeorm';
import { DeploymentWithDetails } from './services/DeploymentService';

// Local cache to avoid frequent DB queries
let servicesCache: Service[] | null = null;
let instancesCache: Instance[] | null = null;
let eventsCache: Event[] | null = null;

// Helper function to reset cache
export function resetCache() {
  servicesCache = null;
  instancesCache = null;
  eventsCache = null;
}

// Database access functions

// Fetch all services
export async function getAllServices(): Promise<Service[]> {
  if (servicesCache) return servicesCache;
  
  const dataSource = await initializeDB();
  const serviceRepo = dataSource.getRepository<Service>('Service');
  const services = await serviceRepo.find();
  servicesCache = services as Service[];
  return services as Service[];
}

// Fetch service by name
export async function getServiceByName(name: string): Promise<Service | null> {
  const dataSource = await initializeDB();
  const serviceRepo = dataSource.getRepository<Service>('Service');
  const service = await serviceRepo.findOne({ where: { name } });
  return service as Service | null;
}

// Fetch all instances
export async function getAllInstances(): Promise<Instance[]> {
  if (instancesCache) return instancesCache;
  
  const dataSource = await initializeDB();
  const instanceRepo = dataSource.getRepository<Instance>('Instance');
  const instances = await instanceRepo.find();
  instancesCache = instances as Instance[];
  return instances as Instance[];
}

// Fetch instances by service name
export async function getInstancesByService(serviceName: string): Promise<Instance[]> {
  const dataSource = await initializeDB();
  const instanceRepo = dataSource.getRepository<Instance>(Instance);
  // Use a more compatible way to query by service name
  const instances = await instanceRepo.createQueryBuilder("instance")
    .where("instance.service = :serviceName", { serviceName })
    .getMany();
  return instances as Instance[];
}

// Get the prod instance for a service (if any)
export async function getProdInstance(serviceName: string): Promise<Instance | null> {
  const dataSource = await initializeDB();
  const instanceRepo = dataSource.getRepository<Instance>('Instance');
  // Use a more compatible way to query by service name and environment
  const instance = await instanceRepo.createQueryBuilder("instance")
    .where("instance.service = :serviceName", { serviceName })
    .andWhere("instance.environment = :environment", { environment: 'prod' })
    .getOne();
  return instance as Instance | null;
}

// Get the dev instance for a service (if any)
export async function getDevInstance(serviceName: string): Promise<Instance | null> {
  const dataSource = await initializeDB();
  const instanceRepo = dataSource.getRepository<Instance>('Instance');
  // Use a more compatible way to query by service name and environment
  const instance = await instanceRepo.createQueryBuilder("instance")
    .where("instance.service = :serviceName", { serviceName })
    .andWhere("instance.environment = :environment", { environment: 'dev' })
    .getOne();
  return instance as Instance | null;
}

// Fetch instance by id
export async function getInstanceById(id: string): Promise<Instance | null> {
  const dataSource = await initializeDB();
  const instanceRepo = dataSource.getRepository<Instance>('Instance');
  const instance = await instanceRepo.findOne({ where: { id } });
  return instance as Instance | null;
}

// Fetch events by instance id
export async function getEventsByInstance(instanceId: string): Promise<Event[]> {
  const dataSource = await initializeDB();
  const eventRepo = dataSource.getRepository<Event>('Event');
  
  // First get deployments for this instance
  const deploymentRepo = dataSource.getRepository('Deployment');
  const deployments = await deploymentRepo.find({ where: { instance_id: instanceId } });
  
  if (deployments.length === 0) return [];
  
  const deploymentIds = deployments.map(d => d.id);
  
  // Get events for these deployments
  const events = await eventRepo.find({ 
    where: { deployment_id: In(deploymentIds) },
    order: { created_at: 'DESC' }
  });
  return events as Event[];
}

// Get last successful deployment for an instance
export async function getLastSuccessfulDeployment(instanceId: string): Promise<Event | null> {
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  
  // Find the most recent successful deployment for this instance
  const deployment = await deploymentRepo.findOne({
    where: { 
      instance_id: instanceId,
      status: 'succeeded'
    },
    order: { completed_at: 'DESC' }
  });
  
  if (!deployment) return null;
  
  // Get the succeeded event for this deployment
  const eventRepo = dataSource.getRepository<Event>('Event');
  const event = await eventRepo.findOne({ 
    where: { 
      deployment_id: deployment.id,
      event_type: 'deployment_succeeded'
    },
    order: { created_at: 'DESC' }
  });
  return event as Event | null;
}

// Get last event for an instance
export async function getLastEvent(instanceId: string): Promise<Event | null> {
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  
  // Find the most recent deployment for this instance
  const deployment = await deploymentRepo.findOne({
    where: { instance_id: instanceId },
    order: { started_at: 'DESC' }
  });
  
  if (!deployment) return null;
  
  // Get the latest event for this deployment
  const eventRepo = dataSource.getRepository<Event>('Event');
  const event = await eventRepo.findOne({ 
    where: { deployment_id: deployment.id },
    order: { created_at: 'DESC' }
  });
  return event as Event | null;
}

// Get last event for a service (across all instances)
export async function getLastServiceEvent(serviceName: string): Promise<Event | null> {
  const instances = await getInstancesByService(serviceName);
  const instanceIds = instances.map(instance => instance.id);
  
  if (instanceIds.length === 0) return null;
  
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  
  // Find the most recent deployment across all these instances
  const deployment = await deploymentRepo.findOne({
    where: { instance_id: In(instanceIds) },
    order: { started_at: 'DESC' }
  });
  
  if (!deployment) return null;
  
  // Get the latest event for this deployment
  const eventRepo = dataSource.getRepository<Event>('Event');
  const event = await eventRepo.findOne({ 
    where: { deployment_id: deployment.id },
    order: { created_at: 'DESC' }
  });
  return event as Event | null;
}

// Get last successful prod deployment for a service
export async function getLastProdDeployment(serviceName: string): Promise<Event | null> {
  const prodInstance = await getProdInstance(serviceName);
  if (!prodInstance) return null;
  
  return getLastSuccessfulDeployment(prodInstance.id);
}

// Count successful deployments for a service in last 30 days
export async function countRecentDeployments(serviceName: string, days = 30): Promise<number> {
  const instances = await getInstancesByService(serviceName);
  const instanceIds = instances.map(instance => instance.id);
  
  if (instanceIds.length === 0) return 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
  
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  
  // Count successful deployments
  return deploymentRepo.count({ 
    where: { 
      instance_id: In(instanceIds),
      status: 'succeeded',
      started_at: MoreThan(thirtyDaysAgo.toISOString())
    }
  });
}

// Get unique environments
export async function getUniqueEnvironments(): Promise<string[]> {
  const instances = await getAllInstances();
  return [...new Set(instances.map(instance => instance.environment))];
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

// Get event color based on event type
export function getEventColor(eventType: string): string {
  switch (eventType) {
    case 'deployment_started':
      return 'bg-blue-100 text-blue-800';
    case 'deployment_succeeded':
      return 'bg-green-100 text-green-800';
    case 'deployment_updated':
      return 'bg-yellow-100 text-yellow-800';
    case 'deployment_failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Get update type badge color
export function getUpdateTypeColor(updateType: string): string {
  switch (updateType) {
    case 'terraform_plan':
      return 'bg-indigo-100 text-indigo-800';
    case 'terraform_apply':
      return 'bg-purple-100 text-purple-800';
    case 'approval_granted':
      return 'bg-emerald-100 text-emerald-800';
    case 'waiting_for_approval':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

// Get short ID for display
export function getShortId(id: string): string {
  return id.substring(0, 8);
}

// Count instances by environment for a service
export async function countInstancesByEnvironment(serviceName: string): Promise<Record<string, number>> {
  const instances = await getInstancesByService(serviceName);
  return instances.reduce((acc, instance) => {
    const { environment } = instance;
    acc[environment] = (acc[environment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// Get the last deployment start event
export async function getLastDeploymentStart(instanceId: string): Promise<Event | null> {
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  
  // Find the most recent deployment
  const deployment = await deploymentRepo.findOne({
    where: { instance_id: instanceId },
    order: { started_at: 'DESC' }
  });
  
  if (!deployment) return null;
  
  const eventRepo = dataSource.getRepository<Event>('Event');
  const event = await eventRepo.findOne({ 
    where: { 
      deployment_id: deployment.id,
      event_type: 'deployment_started'
    },
    order: { created_at: 'DESC' }
  });
  return event as Event | null;
}

// Get deployment status (complete, failed, in-progress)
export type DeploymentStatus = 'succeeded' | 'failed' | 'in-progress' | 'unknown';

export async function getDeploymentStatus(instanceId: string): Promise<DeploymentStatus> {
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  
  // Get the latest deployment
  const deployment = await deploymentRepo.findOne({
    where: { instance_id: instanceId },
    order: { started_at: 'DESC' }
  });
  
  if (!deployment) return 'unknown';
  
  // Return the status directly from the deployment record
  if (deployment.status === 'succeeded') return 'succeeded';
  if (deployment.status === 'failed') return 'failed';
  
  // If the status is not set, assume in-progress
  return 'in-progress';
}

// Count recent deployments by status
export async function countRecentDeploymentsByStatus(serviceName: string, days = 30): Promise<{ succeeded: number, failed: number }> {
  const instances = await getInstancesByService(serviceName);
  const instanceIds = instances.map(instance => instance.id);
  
  if (instanceIds.length === 0) return { succeeded: 0, failed: 0 };
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
  
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  
  const succeeded = await deploymentRepo.count({ 
    where: { 
      instance_id: In(instanceIds),
      status: 'succeeded',
      started_at: MoreThan(thirtyDaysAgo.toISOString())
    }
  });
  
  const failed = await deploymentRepo.count({ 
    where: { 
      instance_id: In(instanceIds),
      status: 'failed',
      started_at: MoreThan(thirtyDaysAgo.toISOString())
    }
  });
  
  return { succeeded, failed };
}

// Get last deployment for a service (regardless of status)
export async function getLastDeployment(serviceName: string): Promise<Event | null> {
  const instances = await getInstancesByService(serviceName);
  const instanceIds = instances.map(instance => instance.id);
  
  if (instanceIds.length === 0) return null;
  
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  
  // Find the latest deployment
  const deployment = await deploymentRepo.findOne({
    where: { instance_id: In(instanceIds) },
    order: { started_at: 'DESC' }
  });
  
  if (!deployment) return null;
  
  // Get the completion event (succeeded or failed)
  const eventRepo = dataSource.getRepository<Event>('Event');
  const event = await eventRepo.findOne({ 
    where: [
      { deployment_id: deployment.id, event_type: 'deployment_succeeded' },
      { deployment_id: deployment.id, event_type: 'deployment_failed' }
    ],
    order: { created_at: 'DESC' }
  });
  
  return event as Event | null;
}

// Get last deployment for an instance
export async function getLastDeploymentForInstance(instanceId: string): Promise<Event | null> {
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  
  // Find the latest deployment
  const deployment = await deploymentRepo.findOne({
    where: { instance_id: instanceId },
    order: { started_at: 'DESC' }
  });
  
  if (!deployment) return null;
  
  // Get the completion event (succeeded or failed)
  const eventRepo = dataSource.getRepository<Event>('Event');
  const event = await eventRepo.findOne({ 
    where: [
      { deployment_id: deployment.id, event_type: 'deployment_succeeded' },
      { deployment_id: deployment.id, event_type: 'deployment_failed' }
    ],
    order: { created_at: 'DESC' }
  });
  
  return event as Event | null;
}

// Get last prod deployment with status for a service
export async function getLastProdDeploymentWithStatus(serviceName: string): Promise<Event | null> {
  const prodInstance = await getProdInstance(serviceName);
  if (!prodInstance) return null;
  
  return getLastDeploymentForInstance(prodInstance.id);
}

// Find the deployment start event that corresponds to a deployment completion event
export async function findDeploymentStartEvent(completionEvent: Event): Promise<Event | null> {
  if (!completionEvent || 
      (completionEvent.event_type !== 'deployment_succeeded' && 
       completionEvent.event_type !== 'deployment_failed')) {
    return null;
  }
  
  const dataSource = await initializeDB();
  const eventRepo = dataSource.getRepository<Event>('Event');
  
  // Since events are now linked to deployments, we can just find the start event
  // for the same deployment
  const events = await eventRepo.find({ 
    where: { 
      deployment_id: completionEvent.deployment_id,
      event_type: 'deployment_started'
    },
    order: { created_at: 'DESC' }
  });
  
  return events.length > 0 ? events[0] as Event : null;
}

// Type guard for deployment started events
interface DeploymentStartedEventData {
  commit: string;
  commit_message: string;
  commit_author: string;
  buildkite_build_url: string;
}

function isDeploymentStartedEvent(event: Event): event is Event & { event_data: DeploymentStartedEventData } {
  return event.event_type === 'deployment_started';
}

// Get deployments by instance
export async function getDeploymentsByInstance(instanceId: string): Promise<DeploymentWithDetails[]> {
  const dataSource = await initializeDB();
  const deploymentRepo = dataSource.getRepository('Deployment');
  const eventRepo = dataSource.getRepository<Event>('Event');
  
  // Get all deployments for this instance
  const deployments = await deploymentRepo.find({
    where: { instance_id: instanceId },
    order: { started_at: 'DESC' }
  });
  
  // Enrich deployments with event data
  const enrichedDeployments: DeploymentWithDetails[] = [];
  
  for (const deployment of deployments) {
    // Get all events for this deployment
    const events = await eventRepo.find({
      where: { deployment_id: deployment.id },
      order: { created_at: 'ASC' }
    });
    
    // Find the start event to get commit info
    const startEvent = events.find(e => e.event_type === 'deployment_started');
    
    if (!startEvent || !isDeploymentStartedEvent(startEvent)) continue;
    
    // Get failed jobs info
    const failedJobs: string[] = [];
    const updateEvents = events.filter(e => e.event_type === 'deployment_updated');
    
    for (const updateEvent of updateEvents) {
      if ('job_state' in updateEvent.event_data && 
          'job_name' in updateEvent.event_data && 
          updateEvent.event_data.job_state && 
          updateEvent.event_data.job_name && 
          ['failed', 'broken', 'waiting_failed'].includes(updateEvent.event_data.job_state)) {
        failedJobs.push(updateEvent.event_data.job_name);
      }
    }
    
    enrichedDeployments.push({
      id: deployment.id,
      instance_id: instanceId,
      started_at: deployment.started_at,
      completed_at: deployment.completed_at,
      status: deployment.status,
      events: events,
      buildkite_build_url: startEvent.event_data.buildkite_build_url,
      commit: startEvent.event_data.commit,
      commit_message: startEvent.event_data.commit_message,
      commit_author: startEvent.event_data.commit_author,
      failed_jobs: failedJobs.length > 0 ? failedJobs : undefined
    });
  }
  
  return enrichedDeployments;
}

// Count deployments by service
export async function countDeploymentsByService(serviceName: string): Promise<number> {
  const instances = await getInstancesByService(serviceName);
  let count = 0;
  
  for (const instance of instances) {
    const deployments = await getDeploymentsByInstance(instance.id);
    count += deployments.length;
  }
  
  return count;
}

// Get deployments by service
export async function getDeploymentsByService(serviceName: string): Promise<DeploymentWithDetails[]> {
  const instances = await getInstancesByService(serviceName);
  let allDeployments: DeploymentWithDetails[] = [];
  
  for (const instance of instances) {
    const deployments = await getDeploymentsByInstance(instance.id);
    allDeployments = [...allDeployments, ...deployments];
  }
  
  // Sort by start time descending
  return allDeployments.sort((a, b) => 
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
}

// Get deployments by environment
export async function getDeploymentsByEnvironment(serviceName: string, environment: string): Promise<DeploymentWithDetails[]> {
  const instances = await getInstancesByService(serviceName);
  const filteredInstances = instances.filter(instance => instance.environment === environment);
  let allDeployments: DeploymentWithDetails[] = [];
  
  for (const instance of filteredInstances) {
    const deployments = await getDeploymentsByInstance(instance.id);
    allDeployments = [...allDeployments, ...deployments];
  }
  
  // Sort by start time descending
  return allDeployments.sort((a, b) => 
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
} 