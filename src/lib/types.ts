export interface Service {
  name: string;
  repo_url: string;
  repo_path: string;
  created_at: string;
}

export interface Instance {
  id: string;
  name: string;
  service: string;
  created_at: string;
  environment: string;
}

export type EventType = 
  | 'deployment_started'
  | 'deployment_succeeded' 
  | 'deployment_updated'
  | 'deployment_failed';

export type JobState =
  | 'passed'
  | 'failed'
  | 'broken'
  | 'blocked'
  | 'waiting_failed';

export type UpdateType = 
  | 'terraform_plan'
  | 'terraform_apply'
  | 'approval_granted'
  | 'waiting_for_approval'
  | 'serverless_deploy'
  | 'other';

export interface DeploymentStartedEventData {
  buildkite_build_url: string;
  pull_request_url: string;
  commit: string;
  commit_message: string;
  commit_author: string;
  job_name?: string;
  job_state?: JobState;
}

export interface DeploymentSucceededEventData {
  buildkite_build_url: string;
  job_name?: string;
  job_state?: JobState;
  plan_output?: string;
  apply_output?: string;
}

export interface DeploymentUpdatedEventData {
  update_type: UpdateType;
  buildkite_build_url?: string;
  job_name?: string;
  job_state?: JobState;
  plan_output?: string;
  apply_output?: string;
  approver?: string;
  approval_url?: string;
}

export interface DeploymentFailedEventData {
  error_message?: string;
  buildkite_build_url?: string;
  job_name?: string;
  job_state?: JobState;
  plan_output?: string;
  apply_output?: string;
  approval_url?: string;
}

export interface Event {
  id: string;
  created_at: string;
  event_type: EventType;
  event_data: DeploymentStartedEventData | DeploymentSucceededEventData | DeploymentUpdatedEventData | DeploymentFailedEventData;
  instance_id: string;
}

export interface Deployment {
  id: string; // ID of the starting event
  buildkite_build_url: string;
  commit?: string;
  commit_message?: string;
  commit_author?: string;
  start_time: string;
  end_time?: string;
  status: 'succeeded' | 'failed' | 'in-progress';
  events: Event[];
  instance_id: string;
  failed_jobs?: string[];
}