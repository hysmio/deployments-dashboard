import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import type { 
  DeploymentStartedEventData,
  DeploymentSucceededEventData, 
  DeploymentUpdatedEventData, 
  DeploymentFailedEventData, 
  EventType 
} from "@/lib/types";

@Entity("api_service_instance_deployment_event")
export class Event {
  @PrimaryColumn()
  id!: string;

  @Column()
  deployment_id!: string;

  @Column({ type: "text" })
  event_type!: EventType;

  @Column({ type: "jsonb" })
  event_data!: 
    DeploymentStartedEventData |
    DeploymentSucceededEventData |
    DeploymentUpdatedEventData |
    DeploymentFailedEventData;

  @Column()
  created_at!: string;
}