"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ServiceSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function ServiceSearchBar({
  searchQuery,
  setSearchQuery,
}: ServiceSearchBarProps) {
  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <Input
        type="text"
        placeholder="Search services..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          onClick={() => setSearchQuery("")}
          className="px-3"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
