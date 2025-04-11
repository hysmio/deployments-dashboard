import { Instance } from "@/lib/models/instance";
import { InstanceItem } from "@/components/InstanceItem";

interface InstanceListProps {
  instances: Instance[];
}

export function InstanceList({ instances }: InstanceListProps) {
  if (instances.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No instances found for this environment
      </div>
    );
  }

  return (
    <div className="divide-y">
      {instances.map((instance) => (
        <InstanceItem key={instance.id} instance={instance} />
      ))}
    </div>
  );
}
