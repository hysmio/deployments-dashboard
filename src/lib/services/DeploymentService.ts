import { ServiceRepository } from "@/lib/repositories/ServiceRepository";
import { InstanceRepository } from "@/lib/repositories/InstanceRepository";
import { DeploymentRepository } from "@/lib/repositories/DeploymentRepository";
import { EventRepository } from "@/lib/repositories/EventRepository";
import { Deployment } from "@/lib/models/deployment";
import { Event } from "@/lib/models/event";
import { DeploymentStartedEventData } from "@/lib/types";
import { In } from "typeorm";

export type DeploymentStatus = 'succeeded' | 'failed' | 'in-progress' | 'unknown';

export interface DeploymentWithDetails extends Deployment {
  events?: Event[];
  commit?: string;
  commit_message?: string;
  commit_author?: string;
  buildkite_build_url?: string;
  failed_jobs?: string[];
}

export class DeploymentService {
  private serviceRepo: ServiceRepository;
  private instanceRepo: InstanceRepository;
  private deploymentRepo: DeploymentRepository;
  private eventRepo: EventRepository;

  constructor() {
    this.serviceRepo = new ServiceRepository();
    this.instanceRepo = new InstanceRepository();
    this.deploymentRepo = new DeploymentRepository();
    this.eventRepo = new EventRepository();
  }

  async getDeploymentsByInstance(instanceId: string): Promise<DeploymentWithDetails[]> {
    const deployments = await this.deploymentRepo.findByInstance(instanceId);
    const enrichedDeployments: DeploymentWithDetails[] = [];

    for (const deployment of deployments) {
      const events = await this.eventRepo.findByDeployment(deployment.id);
      const startEvent = events.find(e => this.eventRepo.isDeploymentStartedEvent(e));
      
      // Extract additional info from the start event if available
      let commitInfo: {
        commit?: string;
        commit_message?: string;
        commit_author?: string;
        buildkite_build_url?: string;
      } = {};

      if (startEvent && startEvent.event_type === 'deployment_started') {
        const data = startEvent.event_data as DeploymentStartedEventData;
        commitInfo = {
          commit: data.commit,
          commit_message: data.commit_message,
          commit_author: data.commit_author,
          buildkite_build_url: data.buildkite_build_url,
        };
      }

      // Collect any failed jobs
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
        ...deployment,
        events,
        ...commitInfo,
        failed_jobs: failedJobs.length > 0 ? failedJobs : undefined
      });
    }

    // Sort by start time descending
    return enrichedDeployments.sort((a, b) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }

  async getDeploymentsByService(serviceName: string): Promise<DeploymentWithDetails[]> {
    // Get all instances for this service
    const instances = await this.instanceRepo.findByService(serviceName);
    const instanceIds = instances.map(instance => instance.id);
    
    if (instanceIds.length === 0) {
      return [];
    }
    
    // Get all deployments for these instances
    const deployments = await this.deploymentRepo.findByInstancesIn(instanceIds);
    const enrichedDeployments: DeploymentWithDetails[] = [];
    
    for (const deployment of deployments) {
      const events = await this.eventRepo.findByDeployment(deployment.id);
      const startEvent = events.find(e => this.eventRepo.isDeploymentStartedEvent(e));
      
      // Extract additional info from the start event if available
      let commitInfo: {
        commit?: string;
        commit_message?: string;
        commit_author?: string;
        buildkite_build_url?: string;
      } = {};

      if (startEvent && startEvent.event_type === 'deployment_started') {
        const data = startEvent.event_data as DeploymentStartedEventData;
        commitInfo = {
          commit: data.commit,
          commit_message: data.commit_message,
          commit_author: data.commit_author,
          buildkite_build_url: data.buildkite_build_url,
        };
      }
      
      enrichedDeployments.push({
        ...deployment,
        ...commitInfo
      });
    }
    
    // Sort by start time descending
    return enrichedDeployments.sort((a, b) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }

  async getDeploymentsByEnvironment(serviceName: string, environment: string): Promise<DeploymentWithDetails[]> {
    // Get instances for this service and environment
    const instances = await this.instanceRepo.findByService(serviceName);
    const filteredInstances = instances.filter(instance => instance.environment === environment);
    const instanceIds = filteredInstances.map(instance => instance.id);
    
    if (instanceIds.length === 0) {
      return [];
    }
    
    // Get all deployments for these instances
    const deployments = await this.deploymentRepo.findByInstancesIn(instanceIds);
    const enrichedDeployments: DeploymentWithDetails[] = [];
    
    for (const deployment of deployments) {
      const events = await this.eventRepo.findByDeployment(deployment.id);
      const startEvent = events.find(e => this.eventRepo.isDeploymentStartedEvent(e));
      
      // Extract additional info from the start event if available
      let commitInfo: {
        commit?: string;
        commit_message?: string;
        commit_author?: string;
        buildkite_build_url?: string;
      } = {};

      if (startEvent && startEvent.event_type === 'deployment_started') {
        const data = startEvent.event_data as DeploymentStartedEventData;
        commitInfo = {
          commit: data.commit,
          commit_message: data.commit_message,
          commit_author: data.commit_author,
          buildkite_build_url: data.buildkite_build_url,
        };
      }
      
      enrichedDeployments.push({
        ...deployment,
        ...commitInfo
      });
    }
    
    // Sort by start time descending
    return enrichedDeployments.sort((a, b) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }

  async countRecentDeploymentsByStatus(serviceName: string, days = 30): Promise<{ succeeded: number, failed: number }> {
    const instances = await this.instanceRepo.findByService(serviceName);
    const instanceIds = instances.map(instance => instance.id);
    
    if (instanceIds.length === 0) {
      return { succeeded: 0, failed: 0 };
    }
    
    let totalSucceeded = 0;
    let totalFailed = 0;
    
    for (const instanceId of instanceIds) {
      const { succeeded, failed } = await this.deploymentRepo.countRecentByInstanceAndStatus(instanceId, days);
      totalSucceeded += succeeded;
      totalFailed += failed;
    }
    
    return { succeeded: totalSucceeded, failed: totalFailed };
  }

  async getLastProdDeployment(serviceName: string): Promise<DeploymentWithDetails | null> {
    // Get the prod instance
    const prodInstance = await this.instanceRepo.findProdInstanceByService(serviceName);
    if (!prodInstance) {
      return null;
    }
    
    // Get the latest deployment
    const deployment = await this.deploymentRepo.findLatestByInstance(prodInstance.id);
    if (!deployment) {
      return null;
    }
    
    // Enrich with events and other details
    const events = await this.eventRepo.findByDeployment(deployment.id);
    const startEvent = events.find(e => this.eventRepo.isDeploymentStartedEvent(e));
    
    let commitInfo: {
      commit?: string;
      commit_message?: string;
      commit_author?: string;
      buildkite_build_url?: string;
    } = {};

    if (startEvent && startEvent.event_type === 'deployment_started') {
      const data = startEvent.event_data as DeploymentStartedEventData;
      commitInfo = {
        commit: data.commit,
        commit_message: data.commit_message,
        commit_author: data.commit_author,
        buildkite_build_url: data.buildkite_build_url,
      };
    }
    
    return {
      ...deployment,
      events,
      ...commitInfo
    };
  }
} 