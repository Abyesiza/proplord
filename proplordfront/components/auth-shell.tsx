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
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-12">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl shadow-primary/10 sm:p-10">
        <h1 className="break-words text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        <div className="mt-6 sm:mt-8">{children}</div>
      </div>
      {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
    </main>
  );
}
