import { createCharge } from "@/actions/manage";
import { ChargesTable } from "@/components/dashboard/charges-table";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { RecordPaymentForm } from "@/components/dashboard/record-payment-form";
import { ActionForm } from "@/components/ui/action-form";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SelectField } from "@/components/ui/form";
import { getCharges, getPayments, getTenants } from "@/lib/data";
import { amountStep, memberOptions } from "@/lib/format";
import type { PropertyDetail } from "@/lib/types";

export async function BillingTab({
  property,
  staff,
  landlord,
}: {
  property: PropertyDetail;
  /** Landlords and caretakers: see every tenant, raise charges and record payments. */
  staff: boolean;
  /** Only landlords can cancel charges. */
  landlord: boolean;
}) {
  const [charges, payments, members] = await Promise.all([
    getCharges(property.id),
    getPayments(property.id),
    staff ? getTenants(property.id) : Promise.resolve([]),
  ]);
  const { currency } = property;

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        <Card>
          <CardHeader title="Charges" description="Rent and other amounts tenants owe" />
          {charges.length === 0 ? (
            <EmptyState title="No charges yet" description={staff ? "Create a charge for a tenant." : "Nothing has been billed to you."} />
          ) : (
            <ChargesTable charges={charges} currency={currency} showTenant={staff} canCancel={landlord} />
          )}
        </Card>
        <Card>
          <CardHeader title="Payments" description="Money received for this property" />
          {payments.length === 0 ? (
            <EmptyState title="No payments yet" />
          ) : (
            <PaymentsTable payments={payments} currency={currency} showTenant={staff} />
          )}
        </Card>
      </div>

      {staff && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader title="New charge" />
            <ActionForm action={createCharge.bind(null, property.id)} submitLabel="Create charge" columns={2}>
              <SelectField label="Tenant" name="memberId" options={memberOptions(members)} emptyLabel="Choose tenant" wide />
              <Field label="Description" name="description" placeholder="Rent for November" wide />
              <Field label={`Amount (${currency})`} name="amount" type="number" step={amountStep(currency)} min={amountStep(currency)} />
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
