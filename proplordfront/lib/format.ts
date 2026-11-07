import type { Member, Who } from "./types";

export const money = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(iso),
  );

export const personName = (who: Who | null | undefined) =>
  who?.profile?.fullName ?? who?.profile?.username ?? "Unknown";

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const humanize = (value: string) =>
  value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Select options for active tenants, labelled with their unit. */
export const memberOptions = (members: Member[]) =>
  members
    .filter((m) => m.status === "active")
    .map((m) => ({
      value: m.id,
      label: `${m.profile?.fullName ?? m.profile?.username ?? "Unknown"}${m.unit ? ` (${m.unit.name})` : ""}`,
    }));

export const location = (p: {
  addressLine?: string | null;
  city?: string | null;
  country?: string | null;
}) => [p.addressLine, p.city, p.country].filter(Boolean).join(", ") || "No address yet";
