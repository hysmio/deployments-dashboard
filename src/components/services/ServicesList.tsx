"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ServiceRow } from "@/components/services/ServiceRow";

interface Service {
  name: string;
  repo_url: string;
  repo_path: string;
  created_at: string;
}

interface ServicesListProps {
  services: Service[];
  isLoading: boolean;
  error: Error | null;
}

export function ServicesList({
  services,
  isLoading,
  error,
}: ServicesListProps) {
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

  if (services.length === 0) {
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
          {services.map((service) => (
            <ServiceRow key={service.name} service={service} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
