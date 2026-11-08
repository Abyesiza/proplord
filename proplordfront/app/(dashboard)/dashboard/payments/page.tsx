import Link from "next/link";
import { suspended } from "@/components/skeletons/suspended";
import { ChargesTable } from "@/components/dashboard/charges-table";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCharges, getPayments, getSummary, selectedPropertyId } from "@/lib/data";
import { isStaff } from "@/lib/roles";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Payments | Proplord" };

export default suspended(PaymentsPage);

async function PaymentsPage({ searchParams }: PageProps<"/dashboard/payments">) {
  const propertyId = await selectedPropertyId(searchParams);
  const [user, charges, payments, summary] = await Promise.all([
    requireUser(),
    getCharges(propertyId),
    getPayments(propertyId),
    getSummary(propertyId),
  ]);
  const staff = isStaff(user.role);
  const open = charges.filter((c) => ["pending", "partial", "overdue"].includes(c.status));

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Payments"
        description={staff ? "What tenants owe and what you have collected." : "What you owe and what you have paid."}
        actions={
          staff && (
            <Link
              href={propertyId ? `/dashboard/payments/new?propertyId=${propertyId}` : "/dashboard/payments/new"}
              className={buttonStyles()}
            >
              Record payment
            </Link>
          )
        }
      />
      <div className="space-y-5">
        <Card>
          <CardHeader title="Outstanding charges" />
          {open.length === 0 ? (
            <EmptyState title="Nothing outstanding" />
          ) : (
            <ChargesTable charges={open} currency={summary.currency} showTenant={staff} />
          )}
        </Card>
        <Card>
          <CardHeader title="Payment history" />
          {payments.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <PaymentsTable payments={payments} currency={summary.currency} showTenant={staff} />
          )}
        </Card>
      </div>
    </>
  );
}
