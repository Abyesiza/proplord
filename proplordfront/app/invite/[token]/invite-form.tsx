"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/ui/form";

export function InviteForm({
  token,
  needsAccount,
}: {
  token: string;
  needsAccount: boolean;
}) {
  const [state, action] = useActionState(acceptInvite.bind(null, token), undefined);
  return (
    <form action={action} className="space-y-5">
      {needsAccount && (
        <>
          <Field label="Full name" name="fullName" autoComplete="name" />
          <Field
            label="Choose a password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            hint="At least 8 characters"
          />
        </>
      )}
      <FormError message={state?.error} />
      <SubmitButton>{needsAccount ? "Create account and join" : "Join property"}</SubmitButton>
    </form>
  );
}
