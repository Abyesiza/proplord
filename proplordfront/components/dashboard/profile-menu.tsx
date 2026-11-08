"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/lib/types";

export function ProfileMenu({ name, role }: { name: string; role: Role }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const roleLabel = ROLE_LABELS[role];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="gradient-brand grid size-10 place-items-center rounded-full text-sm font-black text-primary-foreground">
          {initials(name)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-semibold md:block">{name}</span>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-md border border-border bg-card p-2 text-card-foreground shadow-xl"
        >
          <div className="px-3 py-3">
            <p className="truncate font-semibold">{name}</p>
            <div className="mt-1">
              <Badge variant="outline">{roleLabel}</Badge>
            </div>
          </div>
          <div className="border-t border-border px-3 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Theme
            </p>
            <ThemeToggle />
          </div>
          <form action={logout} className="border-t border-border pt-2">
            <button
              type="submit"
              role="menuitem"
              className="flex min-h-11 w-full items-center gap-3 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <LogOut className="size-4" aria-hidden />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
