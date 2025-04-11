import { Instance } from "@/lib/models/instance";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatRelativeTime } from "@/lib/data";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { InstanceAccordion } from "@/components/InstanceAccordion";

interface EnvironmentAccordionProps {
  environment: string;
  serviceName: string;
  instances: Instance[];
}

export function EnvironmentAccordion({
  environment,
  serviceName,
  instances,
}: EnvironmentAccordionProps) {
  // Sort instances by name
  const sortedInstances = [...instances].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Calculate environment stats
  const totalInstances = instances.length;

  // Note: In a real implementation, you would fetch and display the most recent deployment
  // We're omitting this for now as we'll be loading this data at the instance level
  const mostRecentDeploymentTime = null;
  const mostRecentDeploymentStatus = null;

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full border rounded-lg overflow-hidden"
    >
      <AccordionItem value={environment} className="px-0 border-none">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
          <div className="flex flex-1 justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className={`p-1 px-2 rounded ${getEnvironmentColor(
                  environment
                )}`}
              >
                <span className="font-semibold text-sm">
                  {environment.toUpperCase()}
                </span>
              </div>
              <span className="font-medium">Environment</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">{totalInstances}</span>
                <span className="text-xs text-muted-foreground">Instances</span>
              </div>

              {mostRecentDeploymentTime && mostRecentDeploymentStatus && (
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      mostRecentDeploymentStatus === "succeeded"
                        ? "bg-green-500"
                        : mostRecentDeploymentStatus === "failed"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Last Deploy</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(mostRecentDeploymentTime)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <div>
            {sortedInstances.map((instance) => (
              <InstanceAccordion
                key={instance.id}
                instance={instance}
                serviceName={serviceName}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Helper function to get environment color
function getEnvironmentColor(environment: string): string {
  switch (environment.toLowerCase()) {
    case "prod":
      return "bg-red-100 text-red-800";
    case "staging":
      return "bg-orange-100 text-orange-800";
    case "dev":
      return "bg-blue-100 text-blue-800";
    case "test":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
