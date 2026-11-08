import { Building2, Home, Users, UsersRound, AlertTriangle, Wallet } from "lucide-react";
import Link from "next/link";
import { BarList, ColumnChart, LineChart } from "@/components/charts";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Table, Td } from "@/components/ui/table";
import { getAdminLandlords, getAdminStats } from "@/lib/data";
import { humanize, money, propertyTypeLabel } from "@/lib/format";

const monthShort = (month: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );

export async function AdminOverview({ firstName }: { firstName: string }) {
  const [stats, landlords] = await Promise.all([getAdminStats(), getAdminLandlords()]);
  const { totals, monthly, currency } = stats;
  const cash = (n: number) => money(n, currency);
  const labels = monthly.map((m) => monthShort(m.month));
  const topLandlords = landlords.slice(0, 5);

  return (
    <>
      <section className="hero-glow mb-6 rounded-lg p-5 sm:mb-8 sm:p-8 md:p-10">
        <p className="hero-eyebrow text-xs font-semibold uppercase tracking-widest">Platform admin</p>
        <h1 className="mt-2 break-words text-2xl font-black tracking-tight sm:text-3xl md:text-5xl">
          Welcome back, <span className="gradient-text">{firstName}</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Every landlord, property and payment on Proplord, with how the platform is growing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/dashboard/admin/landlords" className="text-link hover:underline">
            View landlords
          </Link>
          <Link href="/dashboard/admin/properties" className="text-link hover:underline">
            View all properties
          </Link>
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard tone="primary" icon={Wallet} label="Collected this month" value={cash(totals.collectedThisMonth)} hint={`${cash(totals.collectedAllTime)} all time`} />
        <StatCard tone="accent" icon={AlertTriangle} label="Outstanding" value={cash(totals.outstanding)} hint="Unpaid charges across the platform" />
        <StatCard icon={UsersRound} label="Landlords" value={String(totals.landlords)} />
        <StatCard icon={Building2} label="Properties" value={String(totals.properties)} hint={`${totals.units} units`} />
        <StatCard icon={Users} label="Active tenants" value={String(totals.tenants)} />
        <StatCard icon={Home} label="Caretakers" value={String(totals.caretakers)} />
      </div>

      {stats.otherCurrencies.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Money figures cover properties billed in {currency}. Properties in {stats.otherCurrencies.join(", ")} are
          counted everywhere else but left out of the totals.
        </p>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Money collected" description={`Completed payments per month, last 12 months (${currency})`} />
          <ColumnChart
            label="Money collected per month"
            data={monthly.map((m, i) => ({ label: labels[i], value: m.collected }))}
            format={cash}
          />
        </Card>
        <Card>
          <CardHeader title="Growth" description="New landlords, properties and tenants per month" />
          <LineChart
            label="New landlords, properties and tenants per month"
            labels={labels}
            series={[
              { name: "Landlords", values: monthly.map((m) => m.newLandlords), className: "text-primary" },
              { name: "Properties", values: monthly.map((m) => m.newProperties), className: "text-foreground" },
              { name: "Tenants", values: monthly.map((m) => m.newTenants), className: "text-muted-foreground", dashed: true },
            ]}
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader title="Where properties are" description="Top towns and cities" />
          {stats.byLocation.length === 0 ? (
            <EmptyState title="No properties yet" />
          ) : (
            <BarList
              items={stats.byLocation.map((l) => ({
                label: l.city === "Unknown" ? "No location set" : `${l.city}, ${l.country}`,
                value: l.properties,
                text: `${l.properties} ${l.properties === 1 ? "property" : "properties"}`,
                hint: `${l.units} units`,
              }))}
            />
          )}
        </Card>
        <Card>
          <CardHeader title="Property types" />
          {stats.byType.length === 0 ? (
            <EmptyState title="No properties yet" />
          ) : (
            <BarList items={stats.byType.map((t) => ({ label: propertyTypeLabel(t.label), value: t.count, text: String(t.count) }))} />
          )}
        </Card>
        <Card>
          <CardHeader title="How tenants pay" description="Collected by payment method" />
          {stats.byMethod.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <BarList items={stats.byMethod.map((m) => ({ label: humanize(m.label), value: m.amount, text: cash(m.amount) }))} />
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Top landlords"
          description="By money collected"
          action={
            <Link href="/dashboard/admin/landlords" className="text-sm font-semibold text-link hover:underline">
              View all
            </Link>
          }
        />
        {topLandlords.length === 0 ? (
          <EmptyState title="No landlords yet" />
        ) : (
          <Table headers={["Landlord", "Properties", "Tenants", "Collected"]}>
            {topLandlords.map((l) => (
              <tr key={l.id}>
                <Td className="font-semibold">
                  {l.fullName ?? "Unnamed"}
                  <span className="block text-xs font-normal text-muted-foreground">{l.email}</span>
                </Td>
                <Td>{l.properties}</Td>
                <Td>{l.tenants}</Td>
                <Td className="font-semibold">{cash(l.collected)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
