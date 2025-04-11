import { In } from "typeorm";

import { BaseRepository } from "@/lib/repositories/BaseRepository";
import { Instance } from "@/lib/models/instance";

export class InstanceRepository extends BaseRepository<Instance> {
  constructor() {
    super(Instance);
  }
  
  async findByService(serviceName: string): Promise<Instance[]> {
    return this.getRepository().then(repo => 
      repo.createQueryBuilder("instance")
        .where("instance.service = :serviceName", { serviceName })
        .getMany()
    );
  }
  
  async findByServiceNames(serviceNames: string[]): Promise<Instance[]> {
    if (serviceNames.length === 0) return [];
    
    return this.getRepository().then(repo => 
      repo.createQueryBuilder("instance")
        .where("instance.service IN (:...serviceNames)", { serviceNames })
        .getMany()
    );
  }
  
  async findByServiceAndEnvironment(serviceName: string, environment: string): Promise<Instance | null> {
    return this.getRepository().then(repo => 
      repo.createQueryBuilder("instance")
        .where("instance.service = :serviceName", { serviceName })
        .andWhere("instance.environment = :environment", { environment })
        .getOne()
    );
  }

  async findProdInstanceByService(serviceName: string): Promise<Instance | null> {
    return this.findByServiceAndEnvironment(serviceName, 'prod');
  }
  
  async findDevInstanceByService(serviceName: string): Promise<Instance | null> {
    return this.findByServiceAndEnvironment(serviceName, 'dev');
  }
  
  async countByServiceAndEnvironment(serviceName: string): Promise<Record<string, number>> {
    const instances = await this.findByService(serviceName);
    return instances.reduce((acc, instance) => {
      const { environment } = instance;
      acc[environment] = (acc[environment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
} 