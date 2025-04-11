import { DeploymentWithEnrichedData } from "@/lib/types";
import { DeploymentItem } from "@/components/DeploymentItem";

interface DeploymentListProps {
  deployments: DeploymentWithEnrichedData[];
}

export function DeploymentList({ deployments }: DeploymentListProps) {
  if (deployments.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No deployments found for this instance
      </div>
    );
  }

  return (
    <div className="divide-y">
      {deployments.map((deployment) => (
        <DeploymentItem key={deployment.id} deployment={deployment} />
      ))}
    </div>
  );
}
