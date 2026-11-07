import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { humanize } from "@/lib/format";

const variants = {
  default: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-muted-foreground",
  destructive: "bg-destructive text-destructive-foreground",
} as const;

export function Badge({
  variant = "secondary",
  children,
}: {
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide",
        variants[variant],
      )}
    >
      {children}
    </span>
  );
}

const STATUS_VARIANT: Record<string, keyof typeof variants> = {
  paid: "accent",
  completed: "accent",
  active: "accent",
  accepted: "accent",
  partial: "default",
  pending: "secondary",
  overdue: "destructive",
  failed: "destructive",
  cancelled: "outline",
  revoked: "outline",
  inactive: "outline",
  expired: "outline",
  refunded: "outline",
};

/** One place maps every domain status (charge, payment, invite, member) to a badge style. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>{humanize(status)}</Badge>;
}
