import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { Instance } from "./instance";

@Entity("api_service")
export class Service {
  @PrimaryColumn()
  name!: string;

  @Column()
  repo_url!: string;

  @Column()
  repo_path!: string;

  @Column()
  created_at!: string;

  @OneToMany(() => Instance, 'instance.service')
  instances!: Instance[];
} 