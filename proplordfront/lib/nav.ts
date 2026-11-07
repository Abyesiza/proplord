import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Receipt,
  Users,
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
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["landlord", "tenant"] },
  { href: "/dashboard/properties", label: "Properties", icon: Building2, roles: ["landlord"] },
  { href: "/dashboard/properties", label: "My home", icon: Building2, roles: ["tenant"] },
  { href: "/dashboard/tenants", label: "Tenants", icon: Users, roles: ["landlord"] },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard, roles: ["landlord", "tenant"] },
  { href: "/dashboard/receipts", label: "Receipts", icon: Receipt, roles: ["landlord", "tenant"] },
];

export const navFor = (role: Role) =>
  NAV_ITEMS.filter((item) => item.roles.includes(role));

export const isActive = (pathname: string, href: string) =>
  href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
