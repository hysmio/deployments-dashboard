"use client";

import Link from "next/link";
import { formatRelativeTime, getEventColor } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ServiceWithData } from "@/lib/types/service";

export function OptimizedServiceRow({ service }: { service: ServiceWithData }) {
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
        {service.prodDeployment ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <div
                className={`w-2 h-2 mr-2 rounded-full ${
                  service.prodDeployment.event_type === "deployment_succeeded"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <Link
                href={service.prodDeployment.buildkite_url || "#"}
                className="text-sm hover:underline"
                target="_blank"
              >
                {formatRelativeTime(service.prodDeployment.created_at)}
              </Link>
            </div>
            {service.prodDeployment.commitInfo && (
              <div className="text-xs text-muted-foreground ml-4">
                <div
                  className="truncate max-w-40"
                  title={service.prodDeployment.commitInfo.message}
                >
                  {service.prodDeployment.commitInfo.message}
                </div>
                <div>
                  by{" "}
                  <Link
                    href={`https://github.com/${service.prodDeployment.commitInfo.author?.replaceAll(
                      "@",
                      ""
                    )}`}
                    className="hover:underline"
                    target="_blank"
                  >
                    {service.prodDeployment.commitInfo.author}
                  </Link>{" "}
                  (
                  <Link
                    href={`https://github.com/${service.repo_url}/commit/${service.prodDeployment.commitInfo.commit}`}
                    className="hover:underline"
                    target="_blank"
                  >
                    {service.prodDeployment.commitInfo.shortCommit}
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
        {service.recentActivity ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <Badge
                className={getEventColor(service.recentActivity.event_type)}
              >
                {service.recentActivity.event_type.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">
                {formatRelativeTime(service.recentActivity.created_at)}
              </span>
            </div>
            <div className="ml-2 text-xs">
              <span className="text-muted-foreground">
                {service.recentActivity.deployment_id.substring(0, 8)}
              </span>
              <Badge
                variant={
                  service.recentActivity.environment === "prod"
                    ? "destructive"
                    : "success"
                }
                className="ml-2 text-[10px] py-0 h-4"
              >
                {service.recentActivity.environment}
              </Badge>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">None</span>
        )}
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <div className="text-sm">{service.instanceCount}</div>
      </TableCell>

      <TableCell className="hidden lg:table-cell text-right">
        <div className="text-sm font-medium">
          <span className="text-green-500">
            {service.deploymentStats.succeeded}
          </span>
          /
          <span className="text-destructive">
            {service.deploymentStats.failed}
          </span>
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
