"use client";

import { useActionState, useState } from "react";
import { recordPayment } from "@/actions/manage";
import { Field, FormError, SelectField, SubmitButton } from "@/components/ui/form";
import {
  amountStep,
  FREQUENCIES,
  humanize,
  installment,
  memberOptions,
  money,
  personName,
} from "@/lib/format";
import type { Charge, Member } from "@/lib/types";

const METHODS = ["cash", "bank_transfer", "mobile_money", "card", "other"];

const round2 = (n: number) => Math.round(n * 100) / 100;

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
  const [state, action] = useActionState(recordPayment.bind(null, propertyId), undefined);
  const [charge, setCharge] = useState("");
  const [tenant, setTenant] = useState("");
  const [choice, setChoice] = useState<"periods" | "other">("periods");
  const [count, setCount] = useState("1");
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const chargeOptions = charges
    .filter((c) => ["pending", "partial", "overdue"].includes(c.status))
    .map((c) => ({
      value: `${c.id}:${c.memberId}`,
      label: `${personName(c.member)}: ${c.description} (${money(c.amount, currency)})`,
    }));

  // A chosen charge decides the tenant, matching what the server does.
  const member = members.find((m) => m.id === (charge.split(":")[1] || tenant));
  const plan = member && FREQUENCIES.find((f) => f.value === member.paymentFrequency);
  const perPeriod = member ? installment(member) : 0;
  const byPeriods = Boolean(plan) && perPeriod > 0 && choice === "periods";

  const periods = Math.min(36, Math.max(1, Math.floor(Number(count)) || 1));
  const total = round2(perPeriod * periods);
  const noun = (n: number) => `${plan?.noun ?? "period"}${n === 1 ? "" : "s"}`;
  const wide = "col-span-full";

  return (
    <form action={action} className="@container">
      <div className="grid gap-x-6 gap-y-5 @xl:grid-cols-2">
        <SelectField
          label="Apply to a charge"
          name="charge"
          required={false}
          options={chargeOptions}
          emptyLabel="Not linked to a charge"
          hint="If you pick a charge, its tenant is used."
          value={charge}
          onChange={setCharge}
          wide
        />
        <SelectField
          label="Tenant"
          name="memberId"
          required={false}
          options={memberOptions(members)}
          emptyLabel="Choose tenant"
          value={tenant}
          onChange={setTenant}
          wide
        />

        {member && plan && (
          <p className={`${wide} rounded-md bg-muted px-5 py-3 text-sm`}>
            <span className="font-semibold">{plan.label}</span> plan
            {perPeriod > 0 ? (
              <>
                {": "}
                <span className="font-semibold">{money(perPeriod, currency)}</span> per {plan.noun}
                {member.agreedAmount ? " (agreed amount)" : ""}
              </>
            ) : (
              ". No rent is set for this tenant, so enter the amount yourself or set a unit or agreed amount."
            )}
          </p>
        )}

        {member && perPeriod > 0 && (
          <fieldset className={`${wide} flex flex-wrap gap-x-6 gap-y-2`}>
            <legend className="mb-1.5 px-2 text-sm font-semibold">This payment is for</legend>
            {(
              [
                ["periods", `Rent for whole ${plan?.noun}s`],
                ["other", "Another amount"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="choice"
                  value={value}
                  checked={choice === value}
                  onChange={() => setChoice(value)}
                  className="size-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </fieldset>
        )}

        <input type="hidden" name="coverage" value={byPeriods ? "periods" : "other"} />

        {byPeriods ? (
          <>
            <Field
              key={plan?.value}
              label={plan?.value === "biweekly" ? "First period starts" : "First month"}
              name="periodStart"
              type={plan?.value === "biweekly" ? "date" : "month"}
              defaultValue={plan?.value === "biweekly" ? today : today.slice(0, 7)}
              hint={plan?.value === "biweekly" ? undefined : "YYYY-MM"}
            />
            <Field
              label={`How many ${plan?.noun}s`}
              name="periodCount"
              type="number"
              min="1"
              max="36"
              step="1"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
            <Field
              label={`Amount (${currency})`}
              name="amount"
              type="number"
              value={String(total)}
              readOnly
              hint={`${periods} ${noun(periods)} x ${money(perPeriod, currency)}`}
            />
          </>
        ) : (
          <Field
            label={`Amount (${currency})`}
            name="amount"
            type="number"
            step={amountStep(currency)}
            min={amountStep(currency)}
          />
        )}

        <SelectField
          label="Method"
          name="method"
          options={METHODS.map((m) => ({ value: m, label: humanize(m) }))}
        />
        <Field label="Reference" name="reference" required={false} placeholder="Transaction ID or cheque no." />
        <Field label="Note" name="note" required={false} wide />

        <FormError message={state?.error} className={wide} />
        {state?.ok && (
          <p
            role="status"
            className={`${wide} break-all rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground`}
          >
            {state.message ?? "Saved"}
          </p>
        )}
        <div className={`${wide} flex justify-end`}>
          <SubmitButton fullWidth={false}>Record payment and issue receipt</SubmitButton>
        </div>
      </div>
    </form>
  );
}
