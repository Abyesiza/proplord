"use client";

import { Menu } from "lucide-react";
import { logout } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import type { Role } from "@/lib/types";

export function DashboardTopbar({ name, role }: { name: string; role: Role }) {
  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-10">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
        aria-label="Toggle navigation"
        onClick={() => window.dispatchEvent(new Event("toggle-sidebar"))}
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <div className="ml-auto flex items-center gap-3">
        <span className="gradient-brand grid size-10 place-items-center rounded-full text-sm font-black text-primary-foreground">
          {initials(name)}
        </span>
        <div className="hidden text-sm leading-tight sm:block">
          <p className="font-semibold">{name}</p>
          <Badge variant="outline">{role === "landlord" ? "Landlord" : "Tenant"}</Badge>
        </div>
        <form action={logout}>
          <Button variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </div>
    </header>
  );
}
