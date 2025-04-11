"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getAllServices,
  getInstancesByService,
  formatRelativeTime,
  getLastServiceEvent,
  getEventColor,
  getLastProdDeploymentWithStatus,
  findDeploymentStartEvent,
  countRecentDeploymentsByStatus,
  getInstanceById,
} from "@/lib/data";
import { Service, DeploymentStartedEventData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Home() {
  const services = getAllServices();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter services based on search query
  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Services</h2>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              onClick={() => setSearchQuery("")}
              className="px-3"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <TableView services={filteredServices} />
    </div>
  );
}

// TABLE VIEW COMPONENT
function TableView({ services }: { services: Service[] }) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">
          No services found matching the criteria
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px]">Service</TableHead>
            <TableHead className="hidden md:table-cell">
              Last Production Deploy
            </TableHead>
            <TableHead className="hidden md:table-cell">
              Recent Activity
            </TableHead>
            <TableHead className="hidden lg:table-cell">Instances</TableHead>
            <TableHead className="hidden lg:table-cell text-right">
              Deploys (30d)
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const lastProdDeployment = getLastProdDeploymentWithStatus(
              service.name
            );
            const lastEvent = getLastServiceEvent(service.name);
            const deployments = countRecentDeploymentsByStatus(service.name);
            const instances = getInstancesByService(service.name);

            // Get commit information if available
            let commitInfo = null;
            if (lastProdDeployment) {
              const startEvent = findDeploymentStartEvent(lastProdDeployment);
              if (
                startEvent &&
                startEvent.event_type === "deployment_started"
              ) {
                const data =
                  startEvent.event_data as DeploymentStartedEventData;
                commitInfo = {
                  message: data.commit_message,
                  author: data.commit_author,
                  shortCommit: data.commit.substring(0, 7),
                  commit: data.commit,
                };
              }
            }

            // Get instance info for the last event
            let eventInstance = null;
            if (lastEvent) {
              eventInstance = getInstanceById(lastEvent.instance_id);
            }

            return (
              <TableRow key={service.name} className="hover:bg-muted/30">
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
                            lastProdDeployment.event_type ===
                            "deployment_succeeded"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <Link
                          href={
                            lastProdDeployment.event_data.buildkite_build_url!
                          }
                          className="text-sm hover:underline"
                          target="_blank"
                        >
                          {formatRelativeTime(lastProdDeployment.created_at)}
                        </Link>
                      </div>
                      {commitInfo && (
                        <div className="text-xs text-muted-foreground ml-4">
                          <div
                            className="truncate max-w-40"
                            title={commitInfo.message}
                          >
                            {commitInfo.message}
                          </div>
                          <div>
                            by{" "}
                            <Link
                              href={`https://github.com/${commitInfo.author.replaceAll(
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
                      <span className="text-sm text-muted-foreground">
                        None
                      </span>
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
                      {eventInstance && (
                        <div className="ml-2 text-xs">
                          <span className="text-muted-foreground">
                            {eventInstance.name}
                          </span>
                          <Badge
                            variant={
                              eventInstance.environment === "prod"
                                ? "destructive"
                                : "success"
                            }
                            className="ml-2 text-[10px] py-0 h-4"
                          >
                            {eventInstance.environment}
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
                    <span className="text-green-500">
                      {deployments.succeeded}
                    </span>
                    /
                    <span className="text-destructive">
                      {deployments.failed}
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
          })}
        </TableBody>
      </Table>
    </div>
  );
}
