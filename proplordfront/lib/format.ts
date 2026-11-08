import type { Frequency, Member, Payment, Who } from "./types";

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

/** Per tenant, the date their paid periods run up to (exclusive): where the next payment should start. */
export function paidThroughByMember(payments: Payment[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of payments) {
    if (!p.periodEnd || (p.status !== "completed" && p.status !== "pending")) continue;
    if (!result[p.memberId] || p.periodEnd > result[p.memberId]) result[p.memberId] = p.periodEnd;
  }
  return result;
}

/** Value for the first-period input: right after what is already paid, else today. */
export function firstOpenPeriod(resume: string | undefined, today: string, biweekly: boolean): string {
  const from = new Date(`${resume ?? today}T00:00:00Z`);
  // Month plans start on the 1st, so a part-covered month moves to the next one.
  if (!biweekly && resume && from.getUTCDate() !== 1) from.setUTCMonth(from.getUTCMonth() + 1, 1);
  const iso = from.toISOString().slice(0, 10);
  return biweekly ? iso : iso.slice(0, 7);
}

export const location = (p: {
  addressLine?: string | null;
  city?: string | null;
  country?: string | null;
}) => [p.addressLine, p.city, p.country].filter(Boolean).join(", ") || "No address yet";

export const FREQUENCIES: { value: Frequency; label: string; months: number; noun: string }[] = [
  { value: "biweekly", label: "Bi-weekly", months: 0.5, noun: "fortnight" },
  { value: "monthly", label: "Monthly", months: 1, noun: "month" },
  { value: "quarterly", label: "Quarterly (3 months)", months: 3, noun: "quarter" },
  { value: "semiannual", label: "Every 6 months", months: 6, noun: "half-year" },
  { value: "annual", label: "Yearly", months: 12, noun: "year" },
];

export const frequencyLabel = (value: Frequency) =>
  FREQUENCIES.find((f) => f.value === value)?.label ?? humanize(value);

/** Mirrors the API: the agreed amount, else unit rent scaled to the plan. */
export function installment(
  member: Pick<Member, "paymentFrequency" | "agreedAmount" | "unit">,
): number {
  if (member.agreedAmount) return member.agreedAmount;
  const months = FREQUENCIES.find((f) => f.value === member.paymentFrequency)?.months ?? 1;
  return Math.round((member.unit?.rentAmount ?? 0) * months * 100) / 100;
}

const monthYear = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(iso),
  );

/** Human label for the periods a payment covers, or null for a plain payment. */
export function coverage(p: {
  frequency: Frequency | null;
  periodStart: string | null;
  periodEnd: string | null;
}): string | null {
  if (!p.frequency || !p.periodStart || !p.periodEnd) return null;
  const last = new Date(new Date(`${p.periodEnd}T00:00:00Z`).getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (p.frequency === "biweekly") return `${formatDate(p.periodStart)} to ${formatDate(last)}`;
  const [from, to] = [monthYear(p.periodStart), monthYear(last)];
  return from === to ? from : `${from} to ${to}`;
}
