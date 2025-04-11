import { DeploymentService } from './DeploymentService';
import { ServiceDataService } from './ServiceDataService';

// Helper function to create singleton instances of services
const deploymentService = new DeploymentService();
const serviceDataService = new ServiceDataService();

// Export services
export {
  deploymentService,
  serviceDataService,
  DeploymentService, 
  ServiceDataService
};

// Export types
export type { DeploymentWithDetails, DeploymentStatus } from './DeploymentService';
export type { ServiceWithStats } from './ServiceDataService'; 