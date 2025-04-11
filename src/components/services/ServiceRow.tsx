"use client";

import Link from "next/link";
import useSWR from "swr";
import { formatRelativeTime, getEventColor } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

// API fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Service {
  name: string;
  repo_url: string;
  repo_path: string;
}

interface Instance {
  id: string;
  environment: string;
}

interface EventData {
  buildkite_build_url?: string;
  commit?: string;
  commit_message?: string;
  commit_author?: string;
  [key: string]: unknown;
}

interface Event {
  id: string;
  deployment_id: string;
  event_type: string;
  event_data: EventData;
  created_at: string;
}

interface DeploymentWithEnvironment {
  id: string;
  environment: string;
}

interface DeploymentStats {
  succeeded: number;
  failed: number;
}

export function ServiceRow({ service }: { service: Service }) {
  // Fetch service-specific data
  const { data: instancesData } = useSWR<{ data: Instance[] }>(
    `/api/instances?service=${service.name}`,
    fetcher
  );

  const instances = instancesData?.data || [];

  // Get the prod instance ID if available
  const prodInstanceId = instances.find((i) => i.environment === "prod")?.id;

  // Last prod deployment
  const lastProdDeploymentUrl = prodInstanceId
    ? `/api/events?instanceId=${prodInstanceId}&limit=1`
    : null;
  const { data: lastProdDeploymentData } = useSWR<{ data: Event[] }>(
    lastProdDeploymentUrl,
    lastProdDeploymentUrl ? fetcher : null
  );
  const lastProdDeployment = lastProdDeploymentData?.data?.[0];

  // Last event for first instance
  const firstInstanceId = instances[0]?.id;
  const lastEventUrl = firstInstanceId
    ? `/api/events?instanceId=${firstInstanceId}&limit=1`
    : null;
  const { data: lastEventData } = useSWR<{ data: Event[] }>(
    lastEventUrl,
    lastEventUrl ? fetcher : null
  );
  const lastEvent = lastEventData?.data?.[0];

  // Get deployment details if we have an event
  const { data: deploymentData } = useSWR<DeploymentWithEnvironment>(
    lastEvent?.deployment_id
      ? `/api/deployments/${lastEvent.deployment_id}`
      : null,
    fetcher
  );

  // Deployment statistics
  const { data: deploymentsData } = useSWR<DeploymentStats>(
    `/api/stats/deployments?service=${service.name}&days=30`,
    fetcher
  );
  const deployments = deploymentsData || { succeeded: 0, failed: 0 };

  // Get commit information if available
  let commitInfo = null;

  // Always declare startEvent outside conditionals to avoid hook order issues
  const startEventUrl = lastProdDeployment
    ? `/api/events/find-start?completionEventId=${lastProdDeployment.id}`
    : null;
  const { data: startEvent } = useSWR<Event>(
    startEventUrl,
    startEventUrl ? fetcher : null
  );

  if (
    lastProdDeployment &&
    startEvent &&
    startEvent.event_type === "deployment_started"
  ) {
    const data = startEvent.event_data;
    commitInfo = {
      message: data.commit_message,
      author: data.commit_author,
      shortCommit: data.commit?.substring(0, 7),
      commit: data.commit,
    };
  }

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="font-medium pl-4">
        <div>
          <Link
            href={`/service/${service.name}`}
            className="hover:underline text-primary"
          >
            {service.name}
          </Link>
          <br />
          <Link
            href={`${service.repo_url}/tree/main/${service.repo_path}`}
            className="text-xs text-muted-foreground truncate max-w-[180px]"
          >
            {service.repo_path}
          </Link>
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        {lastProdDeployment ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <div
                className={`w-2 h-2 mr-2 rounded-full ${
                  lastProdDeployment.event_type === "deployment_succeeded"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <Link
                href={lastProdDeployment.event_data.buildkite_build_url || "#"}
                className="text-sm hover:underline"
                target="_blank"
              >
                {formatRelativeTime(lastProdDeployment.created_at)}
              </Link>
            </div>
            {commitInfo && (
              <div className="text-xs text-muted-foreground ml-4">
                <div className="truncate max-w-40" title={commitInfo.message}>
                  {commitInfo.message}
                </div>
                <div>
                  by{" "}
                  <Link
                    href={`https://github.com/${commitInfo.author?.replaceAll(
                      "@",
                      ""
                    )}`}
                    className="hover:underline"
                    target="_blank"
                  >
                    {commitInfo.author}
                  </Link>{" "}
                  (
                  <Link
                    href={`https://github.com/${service.repo_url}/commit/${commitInfo.commit}`}
                    className="hover:underline"
                    target="_blank"
                  >
                    {commitInfo.shortCommit}
                  </Link>
                  )
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center">
            <div className="w-2 h-2 mr-2 rounded-full bg-yellow-500" />
            <span className="text-sm text-muted-foreground">None</span>
          </div>
        )}
      </TableCell>

      <TableCell className="hidden md:table-cell">
        {lastEvent ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <Badge className={getEventColor(lastEvent.event_type)}>
                {lastEvent.event_type.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">
                {formatRelativeTime(lastEvent.created_at)}
              </span>
            </div>
            {deploymentData && (
              <div className="ml-2 text-xs">
                <span className="text-muted-foreground">
                  {lastEvent.deployment_id.substring(0, 8)}
                </span>
                <Badge
                  variant={
                    deploymentData.environment === "prod"
                      ? "destructive"
                      : "success"
                  }
                  className="ml-2 text-[10px] py-0 h-4"
                >
                  {deploymentData.environment}
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">None</span>
        )}
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <div className="text-sm">{instances.length}</div>
      </TableCell>

      <TableCell className="hidden lg:table-cell text-right">
        <div className="text-sm font-medium">
          <span className="text-green-500">{deployments.succeeded}</span>/
          <span className="text-destructive">{deployments.failed}</span>
        </div>
      </TableCell>

      <TableCell className="text-right pr-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/service/${service.name}`}>Details</Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
