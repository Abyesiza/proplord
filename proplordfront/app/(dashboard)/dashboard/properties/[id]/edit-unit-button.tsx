"use client";

import { Pencil } from "lucide-react";
import { useActionState, useState } from "react";
import { updateUnit } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { Field, FormError, SubmitButton } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import type { FormState } from "@/lib/form-state";

export function EditUnitButton({
  propertyId,
  unit,
  currency,
  step,
}: {
  propertyId: string;
  unit: { id: string; name: string; rentAmount: number };
  currency: string;
  step: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(async (prev: FormState, data: FormData) => {
    const result = await updateUnit(propertyId, unit.id, prev, data);
    if (result?.ok) setOpen(false);
    return result;
  }, undefined);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`Edit unit ${unit.name}`}
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-4" aria-hidden />
      </Button>

      {open && (
        <Modal title="Edit unit" onClose={() => setOpen(false)}>
          <form action={action} className="space-y-4">
            <Field label="Unit name" name="name" defaultValue={unit.name} />
            <Field
              label={`Monthly rent (${currency})`}
              name="rentAmount"
              type="number"
              step={step}
              min="0"
              defaultValue={String(unit.rentAmount)}
            />
            <FormError message={state?.error} />
            <SubmitButton>Save changes</SubmitButton>
          </form>
        </Modal>
      )}
    </>
  );
}
