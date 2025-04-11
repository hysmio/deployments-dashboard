import { Instance } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { InstanceEvents } from "@/components/InstanceEvents";
import {
  getLastDeploymentForInstance,
  getEventsByInstance,
  getShortId,
  formatRelativeTime,
} from "@/lib/data";

interface InstanceItemProps {
  instance: Instance;
}

export function InstanceItem({ instance }: InstanceItemProps) {
  const lastDeployment = getLastDeploymentForInstance(instance.id);
  const events = getEventsByInstance(instance.id);

  return (
    <Accordion type="single" collapsible className="w-full">
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
                <span className="font-medium">{events.length}</span> events
              </div>

              {lastDeployment && (
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      lastDeployment.event_type === "deployment_succeeded"
                        ? "bg-green-500"
                        : lastDeployment.event_type === "deployment_failed"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    } mr-1`}
                  />
                  <span className="text-xs">
                    {formatRelativeTime(lastDeployment.created_at)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 px-0">
          <div className="border-t pt-4 px-6 pb-2 bg-muted/10 flex justify-between">
            <div className="text-xs font-medium">
              Created: {new Date(instance.created_at).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {getShortId(instance.id)}
            </div>
          </div>
          <InstanceEvents instanceId={instance.id} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
