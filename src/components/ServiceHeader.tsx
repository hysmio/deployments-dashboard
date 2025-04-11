import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Service } from "@/lib/types";
import { useServiceStats } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceHeaderProps {
  service: Service;
  instanceCount: number;
}

export function ServiceHeader({ service, instanceCount }: ServiceHeaderProps) {
  const { stats, isLoading } = useServiceStats(service.name);

  return (
    <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-lg border">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline mb-2 inline-block"
          >
            &larr; Back to Services
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">{service.name}</h2>
          <div className="text-muted-foreground mt-1 break-all flex flex-col gap-1">
            <div className="text-sm">
              <span className="font-medium">Repository:</span>{" "}
              <a
                href={service.repo_url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-primary"
              >
                {service.repo_url}
              </a>
            </div>
            <div className="text-sm">
              <span className="font-medium">Path:</span> {service.repo_path}
            </div>
            <div className="text-sm">
              <span className="font-medium">Created:</span>{" "}
              {new Date(service.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0 sm:items-end">
          <div className="flex gap-2">
            <div className="bg-muted/40 p-2 rounded-md text-center min-w-24">
              <div className="text-2xl font-bold">{instanceCount}</div>
              <div className="text-xs text-muted-foreground">Instances</div>
            </div>
            <div className="bg-muted/40 p-2 rounded-md text-center min-w-24">
              {isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats?.totalDeployments || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Deployments
                  </div>
                </>
              )}
            </div>
          </div>
          <Button asChild>
            <a href={service.repo_url} target="_blank" rel="noreferrer">
              View Repository
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
