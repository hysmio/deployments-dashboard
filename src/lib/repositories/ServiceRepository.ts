import { In } from "typeorm";

import { BaseRepository } from "@/lib/repositories/BaseRepository";
import { Service } from "@/lib/models/service";

export class ServiceRepository extends BaseRepository<Service> {
  constructor() {
    super(Service);
  }
  
  async findByName(name: string): Promise<Service | null> {
    return this.findOne({ name });
  }
  
  // Add any service-specific methods here
} 