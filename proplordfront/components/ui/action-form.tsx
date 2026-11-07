"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { FormState } from "@/lib/form-state";
import { FormError, SubmitButton } from "./form";

/** Server-action form: shows errors and a success note, and clears fields after a successful save. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "space-y-4",
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      <FormError message={state?.error} />
      {state?.ok && (
        <p
          role="status"
          className="break-all rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
        >
          {state.message ?? "Saved"}
        </p>
      )}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
