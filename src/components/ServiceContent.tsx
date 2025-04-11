"use client";

import { Service } from "@/lib/models/service";
import { ServiceHeader } from "@/components/ServiceHeader";
import { EnvironmentAccordion } from "@/components/EnvironmentAccordion";
import { useServiceInstances } from "@/lib/api";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceContentProps {
  service: Service;
}

export function ServiceContent({ service }: ServiceContentProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { instances, pagination, isLoading } = useServiceInstances(
    service.name,
    currentPage,
    100
  );

  // Group instances by environment
  const instancesByEnvironment: Record<string, typeof instances> = {};
  instances.forEach((instance) => {
    if (!instancesByEnvironment[instance.environment]) {
      instancesByEnvironment[instance.environment] = [];
    }
    instancesByEnvironment[instance.environment].push(instance);
  });

  // Get all environment names
  const environments = Object.keys(instancesByEnvironment).sort((a, b) => {
    // Always put prod first, then staging, then alphabetical
    if (a === "prod") return -1;
    if (b === "prod") return 1;
    if (a === "staging") return -1;
    if (b === "staging") return 1;
    return a.localeCompare(b);
  });

  const serviceData = {
    ...service,
  };

  return (
    <div className="space-y-6">
      <ServiceHeader
        service={serviceData}
        instanceCount={pagination?.total || instances.length}
      />

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Loading instances...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Environments</h3>
          <p className="text-muted-foreground text-sm">
            Expand an environment to view its deployments and build history
          </p>

          <div className="space-y-4">
            {environments.map((env) => (
              <EnvironmentAccordion
                key={env}
                environment={env}
                serviceName={service.name}
                instances={instancesByEnvironment[env]}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="py-2 px-3 text-sm">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
