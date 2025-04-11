import services from './data/service.json';
import instances from './data/instance.json';
import events from './data/events.json';
import { Service, Instance, Event, EventType, UpdateType, Deployment, DeploymentStartedEventData } from './types';

// Define interface for the raw service data format
interface RawService {
  name: string;
  repo_url: string;
  repo_path: string;
  "created_at\r"?: string;
  created_at?: string;
}

// Transform service data to match our Service type
const servicesData: Service[] = (services as RawService[]).map(service => ({
  name: service.name,
  repo_url: service.repo_url,
  repo_path: service.repo_path,
  created_at: service["created_at\r"] || service.created_at || ""
}));

const instancesData = instances as Instance[];
const eventsData = events as Event[];

// Fetch all services
export function getAllServices(): Service[] {
  return servicesData;
}

// Fetch service by name
export function getServiceByName(name: string): Service | undefined {
  return servicesData.find(service => service.name === name);
}

// Fetch all instances
export function getAllInstances(): Instance[] {
  return instancesData;
}

// Fetch instances by service name
export function getInstancesByService(serviceName: string): Instance[] {
  return instancesData.filter(instance => instance.service === serviceName);
}

// Get the prod instance for a service (if any)
export function getProdInstance(serviceName: string): Instance | undefined {
  return instancesData.find(instance => 
    instance.service === serviceName && instance.environment === 'prod'
  );
}

// Get the dev instance for a service (if any)
export function getDevInstance(serviceName: string): Instance | undefined {
  return instancesData.find(instance => 
    instance.service === serviceName && instance.environment === 'dev'
  );
}

// Fetch instance by id
export function getInstanceById(id: string): Instance | undefined {
  return instancesData.find(instance => instance.id === id);
}

// Fetch events by instance id
export function getEventsByInstance(instanceId: string): Event[] {
  return eventsData.filter(event => event.instance_id === instanceId);
}

// Get last successful deployment for an instance
export function getLastSuccessfulDeployment(instanceId: string): Event | undefined {
  return eventsData
    .filter(event => event.instance_id === instanceId && event.event_type === 'deployment_succeeded')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

// Get last event for an instance
export function getLastEvent(instanceId: string): Event | undefined {
  return eventsData
    .filter(event => event.instance_id === instanceId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

// Get last event for a service (across all instances)
export function getLastServiceEvent(serviceName: string): Event | undefined {
  const serviceInstances = getInstancesByService(serviceName);
  const instanceIds = serviceInstances.map(instance => instance.id);
  
  return eventsData
    .filter(event => instanceIds.includes(event.instance_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

// Get last successful prod deployment for a service
export function getLastProdDeployment(serviceName: string): Event | undefined {
  const prodInstance = getProdInstance(serviceName);
  if (!prodInstance) return undefined;
  
  return getLastSuccessfulDeployment(prodInstance.id);
}

// Count successful deployments for a service in last 30 days
export function countRecentDeployments(serviceName: string, days = 30): number {
  const instances = getInstancesByService(serviceName);
  const instanceIds = instances.map(instance => instance.id);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
  
  return eventsData.filter(event => 
    instanceIds.includes(event.instance_id) && 
    event.event_type === 'deployment_succeeded' &&
    new Date(event.created_at) > thirtyDaysAgo
  ).length;
}

// Get unique environments
export function getUniqueEnvironments(): string[] {
  return [...new Set(instancesData.map(instance => instance.environment))];
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
export function getEventColor(eventType: EventType): string {
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
export function getUpdateTypeColor(updateType: UpdateType): string {
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
export function countInstancesByEnvironment(serviceName: string): Record<string, number> {
  const instances = getInstancesByService(serviceName);
  return instances.reduce((acc, instance) => {
    const { environment } = instance;
    acc[environment] = (acc[environment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// New helper functions for tracking deployments

// Get the last deployment start event
export function getLastDeploymentStart(instanceId: string): Event | undefined {
  return eventsData
    .filter(event => event.instance_id === instanceId && event.event_type === 'deployment_started')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

// Get deployment status (complete, failed, in-progress)
export type DeploymentStatus = 'succeeded' | 'failed' | 'in-progress' | 'unknown';

export function getDeploymentStatus(instanceId: string): DeploymentStatus {
  const events = eventsData
    .filter(event => event.instance_id === instanceId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  if (events.length === 0) return 'unknown';
  
  const lastEvent = events[0];
  if (lastEvent.event_type === 'deployment_succeeded') return 'succeeded';
  if (lastEvent.event_type === 'deployment_failed') return 'failed';
  
  // Check if there's a deployment_started without a corresponding succeeded/failed
  const lastDeploymentStart = events.find(e => e.event_type === 'deployment_started');
  if (lastDeploymentStart) {
    const startTime = new Date(lastDeploymentStart.created_at).getTime();
    const completionEvent = events.find(e => 
      (e.event_type === 'deployment_succeeded' || e.event_type === 'deployment_failed') &&
      new Date(e.created_at).getTime() > startTime
    );
    
    if (!completionEvent) return 'in-progress';
  }
  
  return 'unknown';
}

// Count recent deployments by status
export function countRecentDeploymentsByStatus(serviceName: string, days = 30): { succeeded: number, failed: number } {
  const instances = getInstancesByService(serviceName);
  const instanceIds = instances.map(instance => instance.id);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
  
  const succeeded = eventsData.filter(event => 
    instanceIds.includes(event.instance_id) && 
    event.event_type === 'deployment_succeeded' &&
    new Date(event.created_at) > thirtyDaysAgo
  ).length;
  
  const failed = eventsData.filter(event => 
    instanceIds.includes(event.instance_id) && 
    event.event_type === 'deployment_failed' &&
    new Date(event.created_at) > thirtyDaysAgo
  ).length;
  
  return { succeeded, failed };
}

// Get the last deployment for a service (could be succeeded or failed)
export function getLastDeployment(serviceName: string): Event | undefined {
  const instances = getInstancesByService(serviceName);
  const instanceIds = instances.map(instance => instance.id);
  
  return eventsData
    .filter(event => 
      instanceIds.includes(event.instance_id) && 
      (event.event_type === 'deployment_succeeded' || event.event_type === 'deployment_failed')
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

// Get the last deployment for an instance (could be succeeded or failed)
export function getLastDeploymentForInstance(instanceId: string): Event | undefined {
  return eventsData
    .filter(event => event.instance_id === instanceId && (event.event_type === 'deployment_succeeded' || event.event_type === 'deployment_failed'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

// Get the last prod deployment for a service (could be succeeded or failed)
export function getLastProdDeploymentWithStatus(serviceName: string): Event | undefined {
  const prodInstance = getProdInstance(serviceName);
  if (!prodInstance) return undefined;
  
  return eventsData
    .filter(event => 
      event.instance_id === prodInstance.id && 
      (event.event_type === 'deployment_succeeded' || event.event_type === 'deployment_failed')
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

// Find the most recent deployment_started event for a given deployment completion event
export function findDeploymentStartEvent(completionEvent: Event): Event | undefined {
  if (completionEvent.event_type !== 'deployment_succeeded' && completionEvent.event_type !== 'deployment_failed') {
    return undefined;
  }
  
  const completionTime = new Date(completionEvent.created_at);
  
  return eventsData
    .filter(event => 
      event.instance_id === completionEvent.instance_id && 
      event.event_type === 'deployment_started' &&
      new Date(event.created_at) < completionTime
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

// Type guard function to check if an event is a deployment started event
function isDeploymentStartedEvent(event: Event): event is Event & { event_data: DeploymentStartedEventData } {
  return event.event_type === 'deployment_started';
}

// Group events by build URL to form deployments
export function getDeploymentsByInstance(instanceId: string): Deployment[] {
  const instanceEvents = getEventsByInstance(instanceId);
  
  // Group events by build URL
  const buildGroups: Record<string, Event[]> = {};
  
  // First pass: Group events by build URL
  instanceEvents.forEach(event => {
    if (!('buildkite_build_url' in event.event_data) || !event.event_data.buildkite_build_url) {
      return; // Skip events without a build URL
    }
    
    const buildUrl = event.event_data.buildkite_build_url;
    if (!buildGroups[buildUrl]) {
      buildGroups[buildUrl] = [];
    }
    buildGroups[buildUrl].push(event);
  });

  
  // Convert groups to Deployment objects
  return Object.entries(buildGroups).map(([buildUrl, events]) => {
    // Sort events by creation time (oldest first for processing)
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // Find deployment_started event if it exists
    const startEvent = sortedEvents.find(e => e.event_type === 'deployment_started');
    
    // Determine status and end time
    let status: 'succeeded' | 'failed' | 'in-progress' = 'in-progress';
    let endTime: string | undefined;
    
    // Find the latest completion event (succeeded or failed)
    const successEvent = sortedEvents
      .filter(e => e.event_type === 'deployment_succeeded')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
    const failedEvent = sortedEvents
      .filter(e => e.event_type === 'deployment_failed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    // Determine the final status based on the most recent completion event
    if (successEvent && failedEvent) {
      const successTime = new Date(successEvent.created_at).getTime();
      const failedTime = new Date(failedEvent.created_at).getTime();
      
      if (successTime > failedTime) {
        status = 'succeeded';
        endTime = successEvent.created_at;
      } else {
        status = 'failed';
        endTime = failedEvent.created_at;
      }
    } else if (successEvent) {
      status = 'succeeded';
      endTime = successEvent.created_at;
    } else if (failedEvent) {
      status = 'failed';
      endTime = failedEvent.created_at;
    } else {
      status = 'in-progress';
    }

    // Extract commit info from deployment_started events
    let commit: string | undefined;
    let commit_message: string | undefined;
    let commit_author: string | undefined;
    
    if (startEvent && isDeploymentStartedEvent(startEvent)) {
      commit = startEvent.event_data.commit;
      commit_message = startEvent.event_data.commit_message;
      commit_author = startEvent.event_data.commit_author;

    }
    
    // Collect any failed jobs
    const failedJobs: string[] = [];
    sortedEvents.forEach(event => {
      if ('job_name' in event.event_data && 
          'job_state' in event.event_data && 
          event.event_data.job_name &&
          event.event_data.job_state && 
          ['failed', 'broken', 'waiting_failed'].includes(event.event_data.job_state) &&
          !failedJobs.includes(event.event_data.job_name)) {
        failedJobs.push(event.event_data.job_name);
      }
    });
    
    // Build the deployment object
    const deployment = {
      id: startEvent?.id || sortedEvents[0].id,
      buildkite_build_url: buildUrl,
      commit,
      commit_message,
      commit_author,
      start_time: sortedEvents[0].created_at,
      end_time: endTime,
      status,
      events: sortedEvents,
      instance_id: instanceId,
      failed_jobs: failedJobs.length > 0 ? failedJobs : undefined
    } as Deployment;
    
    return deployment;
  }).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
}

// Count total deployments for a service
export function countDeploymentsByService(serviceName: string): number {
  const instances = getInstancesByService(serviceName);
  return instances.reduce((total, instance) => {
    return total + getDeploymentsByInstance(instance.id).length;
  }, 0);
}

// Get deployments by service
export function getDeploymentsByService(serviceName: string): Deployment[] {
  const instances = getInstancesByService(serviceName);
  let deployments: Deployment[] = [];
  
  instances.forEach(instance => {
    deployments = [...deployments, ...getDeploymentsByInstance(instance.id)];
  });
  
  return deployments.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
}

// Get deployments by environment
export function getDeploymentsByEnvironment(serviceName: string, environment: string): Deployment[] {
  const instances = getInstancesByService(serviceName)
    .filter(instance => instance.environment === environment);
  
  let deployments: Deployment[] = [];
  
  instances.forEach(instance => {
    deployments = [...deployments, ...getDeploymentsByInstance(instance.id)];
  });
  
  return deployments.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
} 