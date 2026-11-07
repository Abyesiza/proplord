import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/lib/session";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up | Proplord" };

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Signup />
    </Suspense>
  );
}

async function Signup() {
  if (await getUser()) redirect("/dashboard");

  return (
    <AuthShell
      title="Create your account"
      subtitle="For landlords. Tenants join through an invite or a login you create for them."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-link hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
