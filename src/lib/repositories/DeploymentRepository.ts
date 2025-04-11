import { In, LessThan, MoreThan } from "typeorm";

import { BaseRepository } from "@/lib/repositories/BaseRepository";
import { Deployment } from "@/lib/models/deployment";

export class DeploymentRepository extends BaseRepository<Deployment> {
  constructor() {
    super(Deployment);
  }
  
  async findByInstance(instanceId: string): Promise<Deployment[]> {
    return this.findBy({ instance_id: instanceId });
  }
  
  async findLatestByInstance(instanceId: string): Promise<Deployment | null> {
    const repo = await this.getRepository();
    return repo.findOne({
      where: { instance_id: instanceId },
      order: { started_at: 'DESC' }
    });
  }
  
  async countByInstanceAndDateRange(instanceId: string, startDate: Date, endDate: Date): Promise<number> {
    const repo = await this.getRepository();
    return repo.count({
      where: {
        instance_id: instanceId,
        started_at: MoreThan(startDate.toISOString()),
        completed_at: LessThan(endDate.toISOString())
      }
    });
  }
  
  async countRecentByInstanceAndStatus(
    instanceId: string, 
    days: number = 30
  ): Promise<{ succeeded: number, failed: number }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
    
    const repo = await this.getRepository();
    
    const succeeded = await repo.count({
      where: {
        instance_id: instanceId,
        status: 'succeeded',
        started_at: MoreThan(thirtyDaysAgo.toISOString())
      }
    });
    
    const failed = await repo.count({
      where: {
        instance_id: instanceId,
        status: 'failed',
        started_at: MoreThan(thirtyDaysAgo.toISOString())
      }
    });
    
    return { succeeded, failed };
  }
  
  async findByInstancesIn(instanceIds: string[]): Promise<Deployment[]> {
    if (instanceIds.length === 0) return [];
    
    const repo = await this.getRepository();
    return repo.find({
      where: { instance_id: In(instanceIds) },
      order: { started_at: 'DESC' }
    });
  }
  
  async findLatestByInstancesIn(instanceIds: string[]): Promise<Deployment[]> {
    if (instanceIds.length === 0) return [];
    
    // Get all deployments for these instances
    const allDeployments = await this.findByInstancesIn(instanceIds);
    
    // Group by instance_id and keep only the latest deployment for each instance
    const latestByInstance: Record<string, Deployment> = {};
    
    for (const deployment of allDeployments) {
      const instanceId = deployment.instance_id;
      
      if (!latestByInstance[instanceId] || 
          new Date(deployment.started_at) > new Date(latestByInstance[instanceId].started_at)) {
        latestByInstance[instanceId] = deployment;
      }
    }
    
    return Object.values(latestByInstance);
  }

  async findLatestSince(date: Date): Promise<Deployment[]> {
    const repo = await this.getRepository();
    return repo.find({
      where: { started_at: MoreThan(date.toISOString()) },
      order: { started_at: 'DESC' }
    });
  }
  
  async countRecentByInstancesAndStatus(since: Date): Promise<Record<string, { succeeded: number, failed: number }>> {
    const repo = await this.getRepository();
    const deployments = await repo.find({
      where: {
        // Get deployments from the last 30 days
        started_at: MoreThan(since.toISOString())
      },
      order: { started_at: 'DESC' }
    });
    
    // Group by instance_id and count statuses
    const statsByInstance: Record<string, { succeeded: number, failed: number }> = {};
    
    for (const deployment of deployments) {
      if (!statsByInstance[deployment.instance_id]) {
        statsByInstance[deployment.instance_id] = { succeeded: 0, failed: 0 };
      }
      
      if (deployment.status === 'succeeded') {
        statsByInstance[deployment.instance_id].succeeded += 1;
      } else if (deployment.status === 'failed') {
        statsByInstance[deployment.instance_id].failed += 1;
      }
    }
    
    return statsByInstance;
  }
} 