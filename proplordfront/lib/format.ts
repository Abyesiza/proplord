import type { Member, Who } from "./types";

/** Ugandan shillings by default; UGX has no minor unit so it prints without decimals. */
export const money = (amount: number, currency = "UGX") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

/** Input step for an amount in this currency. */
export const amountStep = (currency: string) => (currency === "UGX" ? "1" : "0.01");

export const PROPERTY_TYPES = [
  { value: "apartments", label: "Apartment block" },
  { value: "rental_rooms", label: "Rental rooms" },
  { value: "house", label: "House" },
  { value: "hostel", label: "Hostel" },
  { value: "commercial", label: "Commercial / shops" },
  { value: "mixed_use", label: "Mixed use" },
  { value: "other", label: "Other" },
];

export const propertyTypeLabel = (value: string) =>
  PROPERTY_TYPES.find((t) => t.value === value)?.label ?? humanize(value);

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
