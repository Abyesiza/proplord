import { AlertTriangle, Building2, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { DueChargesCard } from "@/components/dashboard/due-charges-card";
import { RecentPaymentsCard } from "@/components/dashboard/recent-payments-card";
import { buttonStyles } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { getSummary, selectedPropertyId } from "@/lib/data";
import { money } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Overview | Proplord" };

export default async function OverviewPage({ searchParams }: PageProps<"/dashboard">) {
  const propertyId = await selectedPropertyId(searchParams);
  const [user, summary] = await Promise.all([requireUser(), getSummary(propertyId)]);
  const landlord = user.role === "landlord";
  const firstName = (user.fullName ?? user.username ?? "there").split(" ")[0];
  const { currency } = summary;

  return (
    <>
      <section className="hero-glow mb-8 rounded-lg p-8 md:p-10">
        <p className="hero-eyebrow text-xs font-semibold uppercase tracking-widest">
          {landlord ? "Landlord overview" : "Your home"}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
          Welcome back, <span className="gradient-text">{firstName}</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {landlord
            ? "Collect rent, keep tenants organised and hand out receipts in one place."
            : "See what you owe, what you have paid and download your receipts."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {landlord ? (
            <>
              <Link href="/dashboard/properties/new" className={buttonStyles({ variant: "accent" })}>
                Add property
              </Link>
              <Link href="/dashboard/payments/new" className={buttonStyles({ variant: "onDark" })}>
                Record payment
              </Link>
            </>
          ) : (
            <Link href="/dashboard/receipts" className={buttonStyles({ variant: "accent" })}>
              View receipts
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          tone="primary"
          icon={Wallet}
          label={landlord ? "Collected this month" : "Paid this month"}
          value={money(summary.collectedThisMonth, currency)}
        />
        <StatCard
          tone="accent"
          icon={AlertTriangle}
          label={landlord ? "Outstanding" : "Balance due"}
          value={money(summary.outstanding, currency)}
          hint={`${summary.overdueCount} overdue`}
        />
        <StatCard
          icon={Building2}
          label={landlord ? "Properties" : "Homes"}
          value={String(summary.properties)}
          hint={landlord ? `${summary.units} units` : undefined}
        />
        {landlord && (
          <StatCard
            icon={Users}
            label="Active tenants"
            value={String(summary.tenants)}
          />
        )}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <DueChargesCard charges={summary.dueSoon} currency={currency} showTenant={landlord} />
        <RecentPaymentsCard payments={summary.recentPayments} currency={currency} />
      </div>
    </>
  );
}
