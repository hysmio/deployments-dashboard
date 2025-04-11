# Service Dashboard Optimization

## Problem

The original ServicesList and ServiceRow components were making too many individual API calls to display the dashboard:

- One call to `/api/services` to get the list of services
- For each service:
  - One call to `/api/instances?service={service.name}` for instances
  - One call to `/api/events?instanceId={prodInstanceId}&limit=1` for the last prod deployment
  - One call to `/api/events?instanceId={firstInstanceId}&limit=1` for recent activity
  - One call to `/api/deployments/{deploymentId}` for deployment details
  - One call to `/api/events/find-start?completionEventId={eventId}` for finding the start event
  - One call to `/api/stats/deployments?service={service.name}&days=30` for deployment stats

For just 10 services, this could result in 60+ API calls to load the dashboard!

## Solution

We've optimized the dashboard in the following way:

1. Created a new API endpoint `/api/services/dashboard` that:

   - Gets all services in a single query
   - For each service, fetches all the related data on the server side
   - Returns a complete data structure with everything needed for display

2. Created optimized components:

   - `OptimizedServicesList.tsx` - Uses a single API call to fetch the consolidated data
   - `OptimizedServiceRow.tsx` - Displays the pre-fetched data without making any additional API calls

3. Shared types in `src/lib/types/service.ts` to ensure type safety across components

## Benefits

- Reduced from potentially 60+ API calls to a single API call
- Better user experience with faster loading time
- Reduced server load
- Simplified client-side components
- Improved type safety with shared interfaces

## Usage

```tsx
// In page.tsx
import { OptimizedServicesList } from "@/components/services/OptimizedServicesList";

export default function Dashboard() {
  return (
    <div>
      <h1>Services Dashboard</h1>
      <OptimizedServicesList />
    </div>
  );
}
```

## Future Improvements

- Implement pagination if the number of services grows very large
- Add caching on the server side to further reduce database queries
- Consider implementing websocket updates for real-time data
