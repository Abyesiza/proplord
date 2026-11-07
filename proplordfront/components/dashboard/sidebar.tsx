"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";
import { isActive, navFor, withProperty } from "@/lib/nav";
import type { Role } from "@/lib/types";

export function DashboardSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const propertyId = useSearchParams().get("propertyId");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((value) => !value);
    window.addEventListener("toggle-sidebar", toggle);
    return () => window.removeEventListener("toggle-sidebar", toggle);
  }, []);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        aria-label="Dashboard navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out motion-reduce:transition-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-6 py-6">
          <Logo href="/dashboard" />
        </div>
        <nav className="flex-1 space-y-1.5 px-4">
          {navFor(role).map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={label}
                href={withProperty(href, propertyId)}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-primary/10",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="px-6 py-5 text-xs text-muted-foreground">
          {role === "landlord" ? "Landlord workspace" : "Tenant portal"}
        </p>
      </aside>
    </>
  );
}
