export interface Service {
  name: string;
  repo_url: string;
  repo_path: string;
  created_at: string;
}

export interface ServiceWithData {
  name: string;
  repo_url: string;
  repo_path: string;
  created_at: string;
  instances: {
    id: string;
    name: string;
    environment: string;
  }[];
  instanceCount: number;
  prodDeployment: {
    id: string;
    created_at: string;
    event_type: string;
    buildkite_url?: string;
    commitInfo?: {
      message?: string;
      author?: string;
      shortCommit?: string;
      commit?: string;
    };
  } | null;
  recentActivity: {
    id: string;
    created_at: string;
    event_type: string;
    deployment_id: string;
    environment: string;
  } | null;
  deploymentStats: {
    succeeded: number;
    failed: number;
  };
} 