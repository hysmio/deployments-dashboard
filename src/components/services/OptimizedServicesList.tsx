"use client";

import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OptimizedServiceRow } from "./OptimizedServiceRow";
import { ServiceWithData } from "@/lib/types/service";

// API fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface OptimizedServicesListProps {
  filter?: string;
}

export function OptimizedServicesList({
  filter = "",
}: OptimizedServicesListProps) {
  // Fetch all services with their data in a single request
  const {
    data: servicesData,
    error,
    isLoading,
  } = useSWR<ServiceWithData[]>("/api/services/dashboard", fetcher);

  // Filter services based on search query
  const filteredServices = servicesData
    ? servicesData.filter((service) =>
        service.name.toLowerCase().includes(filter.toLowerCase())
      )
    : [];

  if (isLoading) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 border rounded-lg bg-red-50">
        <p className="text-red-500">
          Error loading services. Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (filteredServices.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">
          No services found matching the criteria
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px]">Service</TableHead>
            <TableHead className="hidden md:table-cell">
              Last Production Deploy
            </TableHead>
            <TableHead className="hidden md:table-cell">
              Recent Activity
            </TableHead>
            <TableHead className="hidden lg:table-cell">Instances</TableHead>
            <TableHead className="hidden lg:table-cell text-right">
              Deploys (30d)
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredServices.map((service) => (
            <OptimizedServiceRow key={service.name} service={service} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
