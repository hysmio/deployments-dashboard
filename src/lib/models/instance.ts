import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Event } from "./event";

@Entity("api_service_instance")
export class Instance {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  environment!: string;

  @Column()
  created_at!: string;

  @Column()
  service!: string;

  @OneToMany(() => Event, 'event.instance')
  events!: Event[];
}
