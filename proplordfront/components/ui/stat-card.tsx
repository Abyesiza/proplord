import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const tones = {
  default: "bg-card text-card-foreground border border-border",
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <div className={cn("rounded-md p-6 shadow-sm", tones[tone])}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold opacity-80">{label}</p>
        <span className="grid size-10 place-items-center rounded-full bg-background/20">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-sm opacity-80">{hint}</p>}
    </div>
  );
}
