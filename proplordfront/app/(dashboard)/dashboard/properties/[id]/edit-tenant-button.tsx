"use client";

import { Pencil } from "lucide-react";
import { useActionState, useState } from "react";
import { updateTenantPlan } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { Field, FormError, SelectField, SubmitButton } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { FREQUENCIES } from "@/lib/format";
import type { FormState } from "@/lib/form-state";
import type { Frequency } from "@/lib/types";

export function EditTenantButton({
  propertyId,
  tenant,
  unitOptions,
  currency,
  step,
}: {
  propertyId: string;
  tenant: {
    id: string;
    name: string;
    unitId: string | null;
    paymentFrequency: Frequency;
    agreedAmount: number | null;
  };
  unitOptions: { value: string; label: string }[];
  currency: string;
  step: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(async (prev: FormState, data: FormData) => {
    const result = await updateTenantPlan(propertyId, tenant.id, prev, data);
    if (result?.ok) setOpen(false);
    return result;
  }, undefined);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`Edit ${tenant.name}`}
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-4" aria-hidden />
      </Button>

      {open && (
        <Modal title={`Edit ${tenant.name}`} onClose={() => setOpen(false)}>
          <form action={action} className="space-y-4">
            <SelectField
              label="Unit"
              name="unitId"
              required={false}
              options={unitOptions}
              emptyLabel="No unit"
              defaultValue={tenant.unitId ?? ""}
            />
            <SelectField
              label="Pays"
              name="paymentFrequency"
              options={FREQUENCIES.map(({ value, label }) => ({ value, label }))}
              defaultValue={tenant.paymentFrequency}
            />
            <Field
              label={`Agreed amount per payment (${currency})`}
              name="agreedAmount"
              type="number"
              step={step}
              min={step}
              required={false}
              defaultValue={tenant.agreedAmount ? String(tenant.agreedAmount) : ""}
              hint="Optional. Leave blank to work it out from the unit's monthly rent."
            />
            <FormError message={state?.error} />
            <SubmitButton>Save changes</SubmitButton>
          </form>
        </Modal>
      )}
    </>
  );
}
