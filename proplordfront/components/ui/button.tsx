import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:opacity-95",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  accent: "bg-accent text-accent-foreground shadow-sm hover:opacity-95",
  outline: "border border-border bg-transparent text-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-95",
  /** For `.hero-glow` surfaces, which follow the active theme. */
  onDark: "border border-border bg-transparent text-foreground hover:bg-muted",
} as const;

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
} as const;

type StyleProps = { variant?: keyof typeof variants; size?: keyof typeof sizes };

/** Use directly on `<Link>` / `<a>` to get button styling without a wrapper. */
export const buttonStyles = ({ variant = "primary", size = "md" }: StyleProps = {}) =>
  cn(base, variants[variant], sizes[size]);

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
