import {
  Building2,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Receipt,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

/** Single source for sidebar entries; roles decide who sees what. */
const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin", "landlord", "caretaker", "tenant"] },
  { href: "/dashboard/admin/landlords", label: "Landlords", icon: UsersRound, roles: ["admin"] },
  { href: "/dashboard/admin/properties", label: "All properties", icon: MapPin, roles: ["admin"] },
  { href: "/dashboard/properties", label: "Properties", icon: Building2, roles: ["landlord", "caretaker"] },
  { href: "/dashboard/properties", label: "My home", icon: Building2, roles: ["tenant"] },
  { href: "/dashboard/tenants", label: "Tenants", icon: Users, roles: ["landlord", "caretaker"] },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard, roles: ["landlord", "caretaker", "tenant"] },
  { href: "/dashboard/payment-tracker", label: "Payment tracker", icon: CalendarCheck, roles: ["admin", "landlord", "caretaker"] },
  { href: "/dashboard/receipts", label: "Receipts", icon: Receipt, roles: ["landlord", "caretaker", "tenant"] },
];

export const navFor = (role: Role) =>
  NAV_ITEMS.filter((item) => item.roles.includes(role));

/** Pages whose data can be narrowed to one property with `?propertyId=`. */
export const FILTERED_PATHS = [
  "/dashboard",
  "/dashboard/tenants",
  "/dashboard/payments",
  "/dashboard/receipts",
];

/** Keeps the chosen property when moving between filtered pages. */
export const withProperty = (href: string, propertyId: string | null) =>
  propertyId && FILTERED_PATHS.includes(href)
    ? `${href}?propertyId=${encodeURIComponent(propertyId)}`
    : href;

export const isActive = (pathname: string, href: string) =>
  href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
