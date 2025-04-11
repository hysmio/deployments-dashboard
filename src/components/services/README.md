# Services Component Structure

This directory contains components for displaying and managing services in the application.

## Components

### ServicesList

The `ServicesList` component displays a list of services in a table format. It handles loading, error states, and empty results.

### ServiceSearchBar

The `ServiceSearchBar` component provides a search input for filtering services by name with a "Clear" button to reset the search.

### ServiceRow

The `ServiceRow` component displays a single service row with comprehensive details including:

- Service name and repository path
- Last production deployment with commit information
- Recent activity with deployment information
- Instance count
- Deployment statistics
- Action links

### DeploymentBadge

The `DeploymentBadge` component displays an environment badge with appropriate styling (red for production, green for other environments).

## Usage

The components are designed to work together in the main home page but can also be used independently. The page flow is:

1. Fetch services from the API
2. Filter services based on user search
3. Display services in a table layout with detailed information

## API Dependencies

These components rely on the following API endpoints:

- `/api/services` - List all services
- `/api/instances?service={name}` - List instances for a service
- `/api/events?instanceId={id}&limit=1` - Get the latest event for an instance
- `/api/deployments/{id}` - Get detailed deployment information
- `/api/events/find-start?completionEventId={id}` - Find the start event for a deployment
- `/api/stats/deployments?service={name}&days=30` - Get deployment statistics

## Type Safety

All components use TypeScript interfaces to ensure proper type safety and prop validation:

- `Service` - Information about a service
- `Instance` - Information about a service instance
- `Event` - Information about a deployment event
- `DeploymentWithEnvironment` - Deployment information with environment context
- `DeploymentStats` - Statistics about deployment successes and failures
