import { ServiceRepository } from "@/lib/repositories/ServiceRepository";
import { InstanceRepository } from "@/lib/repositories/InstanceRepository";
import { DeploymentService, DeploymentWithDetails } from "@/lib/services/DeploymentService";
import { Service } from "@/lib/models/service";
import { Instance } from "@/lib/models/instance";

export interface ServiceWithStats extends Service {
  instanceCount: number;
  environmentCounts: Record<string, number>;
  lastDeployment?: DeploymentWithDetails;
}

export class ServiceDataService {
  private serviceRepo: ServiceRepository;
  private instanceRepo: InstanceRepository;
  private deploymentService: DeploymentService;

  constructor() {
    this.serviceRepo = new ServiceRepository();
    this.instanceRepo = new InstanceRepository();
    this.deploymentService = new DeploymentService();
  }

  async getAllServices(): Promise<Service[]> {
    return this.serviceRepo.findAll();
  }

  async getServiceByName(name: string): Promise<Service | null> {
    return this.serviceRepo.findByName(name);
  }

  async getServiceWithStats(name: string): Promise<ServiceWithStats | null> {
    const service = await this.serviceRepo.findByName(name);
    if (!service) {
      return null;
    }

    const instances = await this.instanceRepo.findByService(name);
    const environmentCounts = await this.instanceRepo.countByServiceAndEnvironment(name);
    const lastDeployment = await this.deploymentService.getLastProdDeployment(name);

    return {
      ...service,
      instanceCount: instances.length,
      environmentCounts,
      lastDeployment: lastDeployment || undefined
    };
  }

  async getInstancesByService(serviceName: string): Promise<Instance[]> {
    return this.instanceRepo.findByService(serviceName);
  }

  async getInstanceById(id: string): Promise<Instance | null> {
    return this.instanceRepo.findOne({ id });
  }

  async getProdInstance(serviceName: string): Promise<Instance | null> {
    return this.instanceRepo.findProdInstanceByService(serviceName);
  }

  async getDevInstance(serviceName: string): Promise<Instance | null> {
    return this.instanceRepo.findDevInstanceByService(serviceName);
  }

  async getUniqueEnvironments(): Promise<string[]> {
    const instances = await this.instanceRepo.findAll();
    return [...new Set(instances.map(instance => instance.environment))];
  }
} 