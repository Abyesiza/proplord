import { AlertTriangle, CheckCircle2, Wallet } from "lucide-react";
import Link from "next/link";
import { ColumnChart, LineChart } from "@/components/charts";
import { suspended } from "@/components/skeletons/suspended";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SelectField } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, Td } from "@/components/ui/table";
import { getAdminProperties, getProperties, getRentTracker } from "@/lib/data";
import { formatDate, money } from "@/lib/format";
import { isStaff } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Payment tracker | Proplord" };

const PATH = "/dashboard/payment-tracker";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTERS = [
  { value: "all", label: "Everyone" },
  { value: "unpaid", label: "Not fully paid" },
  { value: "paid", label: "Paid (incl. prepaid)" },
];

const shiftMonth = (month: string, by: number) => {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + by, 1)).toISOString().slice(0, 7);
};

export default suspended(PaymentTrackerPage);

async function PaymentTrackerPage({ searchParams }: PageProps<"/dashboard/payment-tracker">) {
  const user = await requireUser();
  const admin = user.role === "admin";
  if (!admin && !isStaff(user.role)) redirect("/dashboard");

  const query = await searchParams;
  const month = typeof query.month === "string" && /^\d{4}-\d{2}$/.test(query.month) ? query.month : undefined;
  const propertyId = typeof query.propertyId === "string" && UUID.test(query.propertyId) ? query.propertyId : undefined;
  const filter = FILTERS.find((f) => f.value === query.status)?.value ?? "all";

  const [tracker, properties] = await Promise.all([
    getRentTracker(month, propertyId),
    admin
      ? getAdminProperties().then((list) => list.map((p) => ({ id: p.id, name: p.name, city: p.city })))
      : getProperties().then((list) => list.map((p) => ({ id: p.id, name: p.name, city: p.city }))),
  ]);
  const { summary, daily, currency } = tracker;
  const cash = (n: number) => money(n, currency);

  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${tracker.month}-01T00:00:00Z`),
  );
  const href = (m: string) =>
    `${PATH}?month=${m}${propertyId ? `&propertyId=${propertyId}` : ""}${filter === "all" ? "" : `&status=${filter}`}`;

  const cumulative = daily.reduce<{ expected: number; paid: number }[]>((acc, d) => {
    const last = acc.at(-1) ?? { expected: 0, paid: 0 };
    acc.push({ expected: last.expected + d.expected, paid: last.paid + d.paid });
    return acc;
  }, []);

  const rows = tracker.rows.filter((r) => {
    const settled = r.state === "paid" || r.state === "prepaid";
    return filter === "paid" ? settled : filter === "unpaid" ? !settled : true;
  });

  return (
    <>
      <PageHeader
        eyebrow={admin ? "Platform" : "Money"}
        title="Payment tracker"
        description="Who has paid and who hasn't this month. Each tenant's pay day is the day of the month they first paid on, and months paid ahead count as paid."
      />

      <Card className="mb-5">
        <form action={PATH} className="@container">
          <div className="grid items-end gap-x-6 gap-y-5 @xl:grid-cols-2 @4xl:grid-cols-4">
            <Field label="Month" name="month" type="month" defaultValue={tracker.month} hint="YYYY-MM" />
            <SelectField
              label="Property"
              name="propertyId"
              required={false}
              emptyLabel="All properties"
              defaultValue={propertyId ?? ""}
              options={properties.map((p) => ({
                value: p.id,
                label: `${p.name}${p.city ? ` (${p.city})` : ""}`,
              }))}
            />
            <SelectField label="Show" name="status" options={FILTERS} defaultValue={filter} />
            <Button type="submit" size="lg">
              Apply
            </Button>
          </div>
        </form>
      </Card>

      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href={href(shiftMonth(tracker.month, -1))} className="text-sm font-semibold text-link hover:underline">
          &larr; {shiftMonth(tracker.month, -1)}
        </Link>
        <h2 className="text-lg font-black tracking-tight">{monthName}</h2>
        <Link href={href(shiftMonth(tracker.month, 1))} className="text-sm font-semibold text-link hover:underline">
          {shiftMonth(tracker.month, 1)} &rarr;
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="primary" icon={Wallet} label="Rent expected" value={cash(summary.expected)} hint={`${summary.tenants} tenants`} />
        <StatCard icon={CheckCircle2} label="Paid for this month" value={cash(summary.paid)} hint={`${summary.prepaidCount} paid in advance`} />
        <StatCard tone="accent" icon={AlertTriangle} label="Still to pay" value={cash(summary.outstanding)} hint={`${summary.overdueCount} overdue, ${summary.pendingCount} not yet due`} />
        <StatCard
          icon={CheckCircle2}
          label="Paid in full"
          value={summary.tenants ? `${Math.round((summary.paidCount / summary.tenants) * 100)}%` : "0%"}
          hint={`${summary.paidCount} of ${summary.tenants} tenants, ${summary.partialCount} part-paid`}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Expected vs paid" description="By each tenant's pay day, running total" />
          <LineChart
            label={`Rent expected and paid by pay day in ${monthName}`}
            labels={daily.map((d) => String(d.day))}
            labelStep={3}
            format={cash}
            describe={(s) => `${s.name}: ${cash(s.values.at(-1) ?? 0)} by month end`}
            series={[
              { name: "Expected", values: cumulative.map((c) => c.expected), className: "text-foreground", dashed: true },
              { name: "Paid", values: cumulative.map((c) => c.paid), className: "text-primary" },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Pay days" description="Rent due on each day of the month" />
          <ColumnChart
            label={`Rent due per day in ${monthName}`}
            labelStep={3}
            format={cash}
            data={daily.map((d) => ({ label: String(d.day), value: d.expected }))}
          />
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Tenants"
          description={
            tracker.truncated
              ? "Showing the first 300 tenants, overdue first. Pick a property to narrow it down."
              : "Overdue and part-paid first, then by pay day."
          }
        />
        {rows.length === 0 ? (
          <EmptyState title="Nothing to show" description="No tenants with a rent set match this month and filter." />
        ) : (
          <Table headers={["Tenant", "Unit", "Property", "Pay day", "Rent", "Paid", "Paid until", "Status"]}>
            {rows.map((r) => (
              <tr key={r.memberId}>
                <Td className="font-semibold">{r.tenantName ?? "Unknown"}</Td>
                <Td>{r.unitName ?? "Unassigned"}</Td>
                <Td>
                  {r.propertyName}
                  {admin && <span className="block text-xs text-muted-foreground">{r.landlordName}</span>}
                </Td>
                <Td>{formatDate(r.dueDate)}</Td>
                <Td className="font-semibold">{cash(r.expected)}</Td>
                <Td>{cash(r.paid)}</Td>
                <Td>{r.paidThrough ? formatDate(r.paidThrough) : "Nothing yet"}</Td>
                <Td>
                  <StatusBadge status={r.state} />
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
