import { Event } from "@/lib/models/event";
import { Badge } from "@/components/ui/badge";
import { getEventColor, formatDate } from "@/lib/data";
import { EventDetails } from "@/components/EventDetails";

interface EventItemProps {
  event: Event;
  isLast: boolean;
}

// Helper function to check if a deployment_started event has a corresponding completion event
function hasCompletionEvent(startEvent: Event): boolean {
  if (startEvent.event_type !== "deployment_started") return true;

  // This function would need access to all events for the instance
  // For now, always return true as this will be handled in the actual implementation
  return true;
}

export function EventItem({ event, isLast }: EventItemProps) {
  const eventClass = getEventColor(event.event_type);
  // Check if this is a started event with no completion
  const isIncomplete =
    event.event_type === "deployment_started" && !hasCompletionEvent(event);

  return (
    <div className="relative pl-6 pb-8">
      {!isLast && (
        <div className="absolute left-2.5 top-6 w-px h-full bg-muted" />
      )}

      <div
        className={`absolute left-0 top-1 w-5 h-5 rounded-full ${
          eventClass.split(" ")[0]
        } flex items-center justify-center ${
          isIncomplete ? "border-2 border-yellow-400" : ""
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-current" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center">
          <Badge className={eventClass}>
            {event.event_type.replaceAll("_", " ")}
          </Badge>
          <time className="text-xs text-muted-foreground ml-2">
            {formatDate(event.created_at)}
          </time>
          {isIncomplete && (
            <Badge
              variant="outline"
              className="ml-2 text-yellow-600 border-yellow-400"
            >
              In Progress
            </Badge>
          )}
        </div>

        <EventDetails event={event} />
      </div>
    </div>
  );
}
