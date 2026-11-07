import { recordPayment } from "@/actions/manage";
import { ActionForm } from "@/components/ui/action-form";
import { Field, SelectField } from "@/components/ui/form";
import { amountStep, humanize, memberOptions, money, personName } from "@/lib/format";
import type { Charge, Member } from "@/lib/types";

const METHODS = ["cash", "bank_transfer", "mobile_money", "card", "other"];

export function RecordPaymentForm({
  propertyId,
  currency,
  members,
  charges,
}: {
  propertyId: string;
  currency: string;
  members: Member[];
  charges: Charge[];
}) {
  const chargeOptions = charges
    .filter((c) => ["pending", "partial", "overdue"].includes(c.status))
    .map((c) => ({
      value: `${c.id}:${c.memberId}`,
      label: `${personName(c.member)}: ${c.description} (${money(c.amount, currency)})`,
    }));

  return (
    <ActionForm action={recordPayment.bind(null, propertyId)} submitLabel="Record payment and issue receipt" columns={2}>
      <SelectField
        label="Apply to a charge"
        name="charge"
        required={false}
        options={chargeOptions}
        emptyLabel="Not linked to a charge"
        hint="If you pick a charge, its tenant is used."
        wide
      />
      <SelectField label="Tenant" name="memberId" required={false} options={memberOptions(members)} emptyLabel="Choose tenant" />
      <Field label={`Amount (${currency})`} name="amount" type="number" step={amountStep(currency)} min={amountStep(currency)} />
      <SelectField
        label="Method"
        name="method"
        options={METHODS.map((m) => ({ value: m, label: humanize(m) }))}
      />
      <Field label="Reference" name="reference" required={false} placeholder="Transaction ID or cheque no." />
      <Field label="Note" name="note" required={false} wide />
    </ActionForm>
  );
}
