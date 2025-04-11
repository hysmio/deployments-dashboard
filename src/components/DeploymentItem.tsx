import { Deployment } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, formatDate } from "@/lib/data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EventItem } from "@/components/EventItem";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeploymentItemProps {
  deployment: Deployment;
}

export function DeploymentItem({ deployment }: DeploymentItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Get the event count
  const eventCount = deployment.events.length;

  // Get the status color
  const statusColor = getStatusColor(deployment.status);

  // Get commit info
  const commitInfo = deployment.commit ? (
    <div className="text-xs">
      <span className="font-medium">Commit:</span>{" "}
      <span className="text-muted-foreground">
        {deployment.commit.substring(0, 7)}
      </span>
      {deployment.commit_message && (
        <span className="ml-1">- {deployment.commit_message}</span>
      )}
    </div>
  ) : null;

  // Limit the number of events shown initially
  const visibleEvents = showAllEvents
    ? deployment.events
    : deployment.events.slice(0, 3);

  const hasMoreEvents = deployment.events.length > 3;

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      onValueChange={(value) => setIsExpanded(!!value)}
    >
      <AccordionItem value={deployment.id} className="border-none">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
          <div className="flex flex-1 justify-between items-center">
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    deployment.status === "succeeded"
                      ? "bg-green-500"
                      : deployment.status === "failed"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                />
                <span className="font-medium">
                  {formatDate(deployment.start_time)}
                </span>
                <Badge className={statusColor}>
                  {deployment.status.toUpperCase()}
                </Badge>
              </div>
              {commitInfo}
              {deployment.commit_author && (
                <div className="text-xs text-muted-foreground">
                  By: {deployment.commit_author}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{eventCount}</span> events
              </div>

              {deployment.failed_jobs && (
                <Badge variant="destructive" className="text-xs">
                  {deployment.failed_jobs.length} failed jobs
                </Badge>
              )}

              {deployment.end_time && (
                <div className="text-xs text-muted-foreground">
                  {getDeploymentDuration(
                    deployment.start_time,
                    deployment.end_time
                  )}
                </div>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 px-4">
          {isExpanded && (
            <>
              <div className="bg-muted/10 rounded-md p-4">
                <h4 className="text-sm font-semibold mb-2">
                  Build Information
                </h4>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="font-medium">Build URL:</span>{" "}
                    <a
                      href={deployment.buildkite_build_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View build
                    </a>
                  </div>
                  {deployment.failed_jobs && (
                    <div>
                      <span className="font-medium">Failed Jobs:</span>
                      <ul className="list-disc pl-5 mt-1 text-red-600">
                        {deployment.failed_jobs.map((job, index) => (
                          <li key={index}>{job}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Event Timeline</h4>
                <div className="relative pl-6 py-4 space-y-6">
                  {visibleEvents.map((event, index) => (
                    <EventItem
                      key={event.id}
                      event={event}
                      isLast={
                        !showAllEvents && index === visibleEvents.length - 1
                      }
                    />
                  ))}
                </div>

                {hasMoreEvents && (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllEvents(!showAllEvents)}
                    >
                      {showAllEvents
                        ? "Show Less"
                        : `Show All ${eventCount} Events`}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Helper function to get status color
function getStatusColor(status: Deployment["status"]): string {
  switch (status) {
    case "succeeded":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Helper function to calculate deployment duration
function getDeploymentDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMs = end - start;

  // Format as minutes and seconds
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
