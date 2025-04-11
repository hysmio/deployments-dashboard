import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("api_service_instance_deployment")
export class Deployment {
  @PrimaryColumn()
  id!: string;

  @Column()
  instance_id!: string;

  @Column()
  started_at!: string;

  @Column()
  completed_at!: string;

  @Column()
  status!: string;
}