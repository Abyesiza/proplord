"use client";

import { Menu } from "lucide-react";
import { PropertyFilter } from "./property-filter";
import { ProfileMenu } from "./profile-menu";
import type { Role } from "@/lib/types";

export function DashboardTopbar({
  name,
  role,
  properties,
}: {
  name: string;
  role: Role;
  properties: { id: string; name: string }[];
}) {
  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:gap-4 sm:px-4 lg:px-10">
      <button
        type="button"
        className="grid size-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
        aria-label="Toggle navigation"
        onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <PropertyFilter properties={properties} />
      <div className="ml-auto shrink-0">
        <ProfileMenu name={name} role={role} />
      </div>
    </header>
  );
}
