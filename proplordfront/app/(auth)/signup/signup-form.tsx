"use client";

import { useActionState } from "react";
import { signup } from "@/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/ui/form";

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field label="Full name" name="fullName" autoComplete="name" />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters"
      />
      <Field
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={8}
      />
      <FormError message={state?.error} />
      <SubmitButton>Create landlord account</SubmitButton>
    </form>
  );
}
