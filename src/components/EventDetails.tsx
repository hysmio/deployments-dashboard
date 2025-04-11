import {
  DeploymentStartedEventData,
  DeploymentSucceededEventData,
  DeploymentUpdatedEventData,
  DeploymentFailedEventData,
} from "@/lib/types";
import { Event } from "@/lib/models/event";
import { Badge } from "@/components/ui/badge";
import { getUpdateTypeColor } from "@/lib/data";

interface EventDetailsProps {
  event: Event;
}

export function EventDetails({ event }: EventDetailsProps) {
  switch (event.event_type) {
    case "deployment_started": {
      const data = event.event_data as DeploymentStartedEventData;
      return (
        <div className="bg-slate-50 p-3 rounded-md text-sm mt-2 space-y-2">
          <div>
            <span className="font-medium">Commit:</span>{" "}
            <a
              href={data.pull_request_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {data.commit_message}
            </a>
            <span className="text-muted-foreground">
              ({data.commit.substring(0, 7)})
            </span>
          </div>
          <div>
            <span className="font-medium">Author:</span>{" "}
            <span>{data.commit_author}</span>
          </div>
          <div>
            <a
              href={data.buildkite_build_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline text-xs"
            >
              View build
            </a>
          </div>
        </div>
      );
    }

    case "deployment_succeeded": {
      const data = event.event_data as DeploymentSucceededEventData;
      return (
        <div className="bg-green-50 p-3 rounded-md text-sm mt-2">
          <p>Deployment completed successfully.</p>
          <a
            href={data.buildkite_build_url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline text-xs"
          >
            View build
          </a>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
    }

    case "deployment_updated": {
      const data = event.event_data as DeploymentUpdatedEventData;
      return (
        <div className="bg-slate-50 p-3 rounded-md text-sm mt-2 space-y-2">
          <div className="flex items-center">
            <Badge className={getUpdateTypeColor(data.update_type)}>
              {data.update_type.replace("_", " ")}
            </Badge>
          </div>

          {data.update_type === "terraform_plan" && data.plan_output && (
            <div className="font-mono text-xs p-2 bg-slate-100 rounded">
              {data.plan_output}
            </div>
          )}

          {data.update_type === "terraform_apply" && data.apply_output && (
            <div className="font-mono text-xs p-2 bg-slate-100 rounded">
              {data.apply_output}
            </div>
          )}

          {data.update_type === "approval_granted" && data.approver && (
            <div>Approved by {data.approver}</div>
          )}

          {data.update_type === "waiting_for_approval" && data.approval_url && (
            <div>
              <a
                href={data.approval_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                View approval request
              </a>
            </div>
          )}
        </div>
      );
    }

    case "deployment_failed": {
      const data = event.event_data as DeploymentFailedEventData;
      return (
        <div className="bg-red-50 p-3 rounded-md text-sm mt-2">
          <p className="text-red-700 font-medium">Deployment failed</p>
          <p className="mt-1">{data.error_message}</p>
          {data.buildkite_build_url && (
            <a
              href={data.buildkite_build_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline text-xs"
            >
              View build
            </a>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
