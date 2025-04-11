"use client";

import { Badge } from "@/components/ui/badge";

interface DeploymentBadgeProps {
  environment: string;
}

export function DeploymentBadge({ environment }: DeploymentBadgeProps) {
  return (
    <Badge
      variant={environment === "prod" ? "destructive" : "success"}
      className="ml-2 text-[10px] py-0 h-4"
    >
      {environment}
    </Badge>
  );
}
