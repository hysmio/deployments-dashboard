import { In, LessThan, MoreThan } from "typeorm";

import { BaseRepository } from "@/lib/repositories/BaseRepository";
import { Event } from "@/lib/models/event";
import { EventType } from "@/lib/types";

export class EventRepository extends BaseRepository<Event> {
  constructor() {
    super(Event);
  }

  async findByDeployment(deploymentId: string): Promise<Event[]> {
    const repo = await this.getRepository();
    return repo.find({
      where: { deployment_id: deploymentId },
      order: { created_at: 'DESC' }
    });
  }

  async findLatestByDeployment(deploymentId: string): Promise<Event | null> {
    const repo = await this.getRepository();
    return repo.findOne({
      where: { deployment_id: deploymentId },
      order: { created_at: 'DESC' }
    });
  }

  async findLatestByDeploymentAndType(deploymentId: string, eventType: EventType): Promise<Event | null> {
    const repo = await this.getRepository();
    return repo.findOne({
      where: { 
        deployment_id: deploymentId,
        event_type: eventType
      },
      order: { created_at: 'DESC' }
    });
  }

  async findStartEventBeforeEvent(event: Event): Promise<Event | null> {
    if (!event || 
        (event.event_type !== 'deployment_succeeded' && 
         event.event_type !== 'deployment_failed')) {
      return null;
    }
    
    const repo = await this.getRepository();
    
    // Find the closest preceding deployment_started event using LessThan
    const events = await repo.find({ 
      where: { 
        deployment_id: event.deployment_id,
        event_type: 'deployment_started',
        created_at: LessThan(event.created_at)
      },
      order: { created_at: 'DESC' }
    });
    
    return events.length > 0 ? events[0] : null;
  }
  
  // Helper method for easier event type checking
  isDeploymentStartedEvent(event: Event): boolean {
    return event.event_type === 'deployment_started';
  }

  async findSince(date: Date): Promise<Event[]> {
    const repo = await this.getRepository();
    return repo.find({
      where: { created_at: MoreThan(date.toISOString()) },
      order: { created_at: 'DESC' }
    });
  }
  
  async findByDeploymentIds(deploymentIds: string[]): Promise<Event[]> {
    if (deploymentIds.length === 0) return [];
    
    const repo = await this.getRepository();
    return repo.find({
      where: { deployment_id: In(deploymentIds) },
      order: { created_at: 'DESC' }
    });
  }
} 