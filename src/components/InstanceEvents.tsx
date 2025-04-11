import { getEventsByInstance } from "@/lib/data";
import { EventItem } from "@/components/EventItem";

interface InstanceEventsProps {
  instanceId: string;
}

export async function InstanceEvents({ instanceId }: InstanceEventsProps) {
  const events = await getEventsByInstance(instanceId);

  // Sort events chronologically, most recent first
  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No events found for this instance
      </div>
    );
  }

  return (
    <div className="relative pl-6 py-4 px-6 space-y-6">
      {sortedEvents.map((event, index) => (
        <EventItem
          key={event.id}
          event={event}
          isLast={index === sortedEvents.length - 1}
        />
      ))}
    </div>
  );
}
