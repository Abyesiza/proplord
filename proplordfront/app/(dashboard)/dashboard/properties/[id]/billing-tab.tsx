import { createCharge } from "@/actions/manage";
import { ChargesTable } from "@/components/dashboard/charges-table";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { RecordPaymentForm } from "@/components/dashboard/record-payment-form";
import { ActionForm } from "@/components/ui/action-form";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SelectField } from "@/components/ui/form";
import { getCharges, getMembers, getPayments } from "@/lib/data";
import { memberOptions } from "@/lib/format";
import type { PropertyDetail } from "@/lib/types";

export async function BillingTab({
  property,
  landlord,
}: {
  property: PropertyDetail;
  landlord: boolean;
}) {
  const [charges, payments, members] = await Promise.all([
    getCharges(property.id),
    getPayments(property.id),
    landlord ? getMembers(property.id) : Promise.resolve([]),
  ]);
  const { currency } = property;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-5">
        <Card>
          <CardHeader title="Charges" description="Rent and other amounts tenants owe" />
          {charges.length === 0 ? (
            <EmptyState title="No charges yet" description={landlord ? "Create a charge for a tenant." : "Nothing has been billed to you."} />
          ) : (
            <ChargesTable charges={charges} currency={currency} showTenant={landlord} canCancel={landlord} />
          )}
        </Card>
        <Card>
          <CardHeader title="Payments" description="Money received for this property" />
          {payments.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <PaymentsTable payments={payments} currency={currency} showTenant={landlord} />
          )}
        </Card>
      </div>

      {landlord && (
        <div className="space-y-5">
          <Card>
            <CardHeader title="New charge" />
            <ActionForm action={createCharge.bind(null, property.id)} submitLabel="Create charge">
              <SelectField label="Tenant" name="memberId" options={memberOptions(members)} emptyLabel="Choose tenant" />
              <Field label="Description" name="description" placeholder="Rent for November" />
              <Field label={`Amount (${currency})`} name="amount" type="number" step="0.01" min="0.01" />
              <Field label="Due date" name="dueDate" type="date" />
            </ActionForm>
          </Card>
          <Card>
            <CardHeader title="Record a payment" />
            <RecordPaymentForm propertyId={property.id} currency={currency} members={members} charges={charges} />
          </Card>
        </div>
      )}
    </div>
  );
}
