"use client";

import { Building2, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FILTERED_PATHS } from "@/lib/nav";

/** Narrows the current dashboard page to one property via `?propertyId=`. */
export function PropertyFilter({
  properties,
}: {
  properties: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();

  if (properties.length < 2 || !FILTERED_PATHS.includes(pathname)) return null;

  const current = params.get("propertyId") ?? "";
  const value = properties.some((p) => p.id === current) ? current : "";

  function change(next: string) {
    const query = new URLSearchParams(params.toString());
    if (next) query.set("propertyId", next);
    else query.delete("propertyId");
    const search = query.toString();
    router.push(search ? `${pathname}?${search}` : pathname);
  }

  return (
    <label className="no-print relative flex min-w-0 max-w-64 flex-1 items-center">
      <span className="sr-only">Filter by property</span>
      <Building2
        className="pointer-events-none absolute left-4 size-4 text-muted-foreground"
        aria-hidden
      />
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        className="h-11 w-full min-w-0 appearance-none truncate rounded-full border border-input bg-background pl-10 pr-10 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
      >
        <option value="">All properties</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 size-4 text-muted-foreground"
        aria-hidden
      />
    </label>
  );
}
