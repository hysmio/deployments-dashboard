"use client";

import { Button } from "@/components/ui/button";
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";

interface UserMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export default function UserMenu({ user }: UserMenuProps) {
  if (!user) {
    return (
      <Button
        variant="ghost"
        className="text-white hover:text-blue-300"
        onClick={() => signIn("github")}
      >
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name || "User"}
          width={32}
          height={32}
          className="rounded-full"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
          {user.name?.[0] || "U"}
        </div>
      )}
      <span className="text-sm hidden md:inline">{user.name}</span>
      <Button
        variant="ghost"
        className="text-white hover:text-blue-300"
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      >
        Sign Out
      </Button>
    </div>
  );
}
