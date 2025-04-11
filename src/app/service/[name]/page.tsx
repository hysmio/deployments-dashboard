import { notFound } from "next/navigation";
import { ServiceRepository } from "@/lib/repositories/ServiceRepository";
import { ServiceContent } from "@/components/ServiceContent";

interface ServicePageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { name } = await params;
  const serviceRepo = new ServiceRepository();
  const service = await serviceRepo.findOne({ name });

  if (!service) {
    notFound();
  }

  const serviceData = {
    ...service,
  };

  return <ServiceContent service={serviceData} />;
}
