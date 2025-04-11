"use client";

import { useState } from "react";
import { ServiceSearchBar } from "@/components/services/ServiceSearchBar";
import { OptimizedServicesList } from "@/components/services/OptimizedServicesList";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Services</h2>
        <ServiceSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      <OptimizedServicesList filter={searchQuery} />
    </div>
  );
}
