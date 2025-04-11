import { Deployment } from "./models/deployment";
import { Event } from "./models/event";

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

export type DeploymentWithEnrichedData = Deployment & {
  started_at: string;
  buildkite_build_url: string;
  commit_author: string;
  commit_message: string;
  commit: string;
  events: Event[];
  id: string;
  instance_id: string;
  status: Deployment["status"];
  failed_jobs: string[];
  completed_at: string;
};
