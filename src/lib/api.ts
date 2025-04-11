import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { Service } from "@/lib/models/service";
import { Instance } from "@/lib/models/instance";
import { Event } from "@/lib/models/event";
import { Deployment } from "@/lib/models/deployment";

// Generic paginated response type
export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
}

// Define the fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.message = await response.text();
    throw error;
  }
  return response.json();
};

// Service API hooks
export function useService(name: string) {
  const { data, error, isLoading, mutate } = useSWR<Service>(
    `/api/services?name=${encodeURIComponent(name)}`,
    fetcher
  );

  return {
    service: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function useServices() {
  const { data, error, isLoading, mutate } = useSWR<Service[]>(
    '/api/services',
    fetcher
  );

  return {
    services: data || [],
    isLoading,
    isError: error,
    mutate
  };
}

// Instance API hooks
export function useInstance(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Instance>(
    `/api/instances?id=${encodeURIComponent(id)}`,
    fetcher
  );

  return {
    instance: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function useServiceInstances(serviceName: string, page = 1, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Instance>>(
    `/api/instances?service=${encodeURIComponent(serviceName)}&page=${page}&limit=${limit}`,
    fetcher
  );

  return {
    instances: data?.data || [],
    pagination: data ? {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages
    } : null,
    isLoading,
    isError: error,
    mutate
  };
}

// Events API hooks with infinite loading support
export function useInfiniteEvents(instanceId: string, limit = 10) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<Event> | null) => {
    // Reached the end
    if (previousPageData && !previousPageData.data.length) return null;
    
    // First page, no previousPageData
    if (pageIndex === 0) return `/api/events?instanceId=${encodeURIComponent(instanceId)}&page=1&limit=${limit}`;
    
    // Add page to API endpoint
    return `/api/events?instanceId=${encodeURIComponent(instanceId)}&page=${pageIndex + 1}&limit=${limit}`;
  };

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<PaginatedResponse<Event>>(
    getKey,
    fetcher
  );

  const events = data ? data.flatMap(page => page.data) : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.data.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data.length < limit);

  return {
    events,
    pagination: {
      loadMore: () => setSize(size + 1),
      isLoadingMore,
      isReachingEnd
    },
    isLoading,
    isError: error,
    mutate
  };
}

// Deployments API hooks with infinite loading support
export function useInfiniteDeployments(params: { instanceId?: string, service?: string, environment?: string }, limit = 10) {
  const { instanceId, service, environment } = params;
  
  // Construct the base URL based on provided params
  let baseUrl = '/api/deployments?';
  if (instanceId) baseUrl += `instanceId=${encodeURIComponent(instanceId)}&`;
  if (service) baseUrl += `service=${encodeURIComponent(service)}&`;
  if (environment) baseUrl += `environment=${encodeURIComponent(environment)}&`;
  
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<Deployment> | null) => {
    // Reached the end
    if (previousPageData && !previousPageData.data.length) return null;
    
    // First page, no previousPageData
    if (pageIndex === 0) return `${baseUrl}page=1&limit=${limit}`;
    
    // Add page to API endpoint
    return `${baseUrl}page=${pageIndex + 1}&limit=${limit}`;
  };

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<PaginatedResponse<Deployment>>(
    getKey,
    fetcher
  );

  const deployments = data ? data.flatMap(page => page.data) : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.data.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data.length < limit);

  return {
    deployments,
    pagination: {
      loadMore: () => setSize(size + 1),
      isLoadingMore,
      isReachingEnd
    },
    isLoading,
    isError: error,
    mutate
  };
}

// Stats API hooks
export function useServiceStats(serviceName: string, days = 30) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/stats?service=${encodeURIComponent(serviceName)}&days=${days}`,
    fetcher
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate
  };
} 