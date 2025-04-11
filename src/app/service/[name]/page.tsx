import { notFound } from "next/navigation";
import { getServiceByName } from "@/lib/data";
import { ServiceContent } from "@/components/ServiceContent";

interface ServicePageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { name } = await params;
  const service = getServiceByName(name);

  if (!service) {
    notFound();
  }

  return <ServiceContent service={service} />;
}
