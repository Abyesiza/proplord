import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-2xl shadow-primary/10 sm:p-10">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
      {footer && <p className="mt-6 text-sm text-muted-foreground">{footer}</p>}
    </main>
  );
}
