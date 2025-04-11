import { Instance } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { DeploymentList } from "@/components/DeploymentList";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useInfiniteDeployments } from "@/lib/api";
import { formatRelativeTime } from "@/lib/data";

interface InstanceAccordionProps {
  instance: Instance;
  serviceName: string;
}

// Helper function to get a shortened ID for display
function getShortId(id: string): string {
  return id.substring(0, 8);
}

export function InstanceAccordion({
  instance,
  serviceName,
}: InstanceAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only fetch deployments when the accordion is open (lazy loading)
  const { deployments, isLoading, pagination } = useInfiniteDeployments(
    {
      instanceId: isOpen ? instance.id : undefined,
    },
    10 // Limit per page
  );

  // Get most recent deployment
  const mostRecentDeployment = deployments.length > 0 ? deployments[0] : null;

  // Count deployments by status
  const successCount = deployments.filter(
    (d) => d.status === "succeeded"
  ).length;
  const failedCount = deployments.filter((d) => d.status === "failed").length;
  const inProgressCount = deployments.filter(
    (d) => d.status === "in-progress"
  ).length;

  function handleAccordionChange(value: string) {
    setIsOpen(value === instance.id);
  }

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? instance.id : ""}
      onValueChange={handleAccordionChange}
      className="w-full border rounded-b overflow-hidden mb-4"
    >
      <AccordionItem value={instance.id} className="border-none">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
          <div className="flex flex-1 justify-between items-center">
            <div className="flex flex-col text-left">
              <span className="font-medium">{instance.name}</span>
              <span className="text-xs text-muted-foreground">
                {getShortId(instance.id)}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">
                  {isOpen && !isLoading ? deployments.length : "-"}
                </span>{" "}
                deployments
              </div>

              {mostRecentDeployment && (
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      mostRecentDeployment.status === "succeeded"
                        ? "bg-green-500"
                        : mostRecentDeployment.status === "failed"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    } mr-1`}
                  />
                  <span className="text-xs">
                    {formatRelativeTime(mostRecentDeployment.start_time)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="bg-muted/10">
          <div className="pt-2 px-4 pb-1 flex justify-between border-b mb-2">
            <div className="text-xs font-medium">
              Created: {new Date(instance.created_at).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {getShortId(instance.id)}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading deployments...
              </span>
            </div>
          ) : deployments.length > 0 ? (
            <div>
              <div className="px-4 pt-1 pb-3 flex gap-3">
                {successCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    {successCount} Successful
                  </Badge>
                )}
                {failedCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    {failedCount} Failed
                  </Badge>
                )}
                {inProgressCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    {inProgressCount} In Progress
                  </Badge>
                )}
              </div>

              <div className="px-4 pb-4">
                <DeploymentList deployments={deployments} />

                {!pagination.isReachingEnd && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pagination.loadMore()}
                      disabled={pagination.isLoadingMore}
                    >
                      {pagination.isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No deployments found for this instance
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
