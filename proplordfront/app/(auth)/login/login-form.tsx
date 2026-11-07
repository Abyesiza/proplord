"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/ui/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        label="Email or username"
        name="identifier"
        autoComplete="username"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
      />
      <FormError message={state?.error} />
      <SubmitButton>Log in</SubmitButton>
    </form>
  );
}
