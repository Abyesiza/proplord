"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { FormState } from "@/lib/form-state";
import { FormError, SubmitButton } from "./form";

const LAYOUTS = {
  1: "space-y-4",
  2: "grid gap-x-6 gap-y-5 @xl:grid-cols-2",
  3: "grid gap-x-6 gap-y-5 @xl:grid-cols-2 @4xl:grid-cols-3",
} as const;

/**
 * Server-action form: shows errors and a success note, and clears fields after a
 * successful save. `columns` lays fields out in a grid that responds to the form's
 * own width (container query), so it suits full-page cards and narrow panels alike.
 */
export function ActionForm({
  action,
  submitLabel,
  children,
  columns = 1,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  columns?: keyof typeof LAYOUTS;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const multi = columns > 1;

  return (
    <form ref={formRef} action={formAction} className="@container">
      <div className={LAYOUTS[columns]}>
        {children}
        <FormError message={state?.error} className={multi ? "col-span-full" : undefined} />
        {state?.ok && (
          <p
            role="status"
            className={cn(
              "break-all rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground",
              multi && "col-span-full",
            )}
          >
            {state.message ?? "Saved"}
          </p>
        )}
        <div className={multi ? "col-span-full flex justify-end" : undefined}>
          <SubmitButton fullWidth={!multi}>{submitLabel}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
