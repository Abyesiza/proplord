import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/lib/session";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in | Proplord" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Login searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Login({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  if (await getUser()) redirect("/dashboard");
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in with your email or the username your landlord gave you."
      footer={
        <>
          New landlord?{" "}
          <Link href="/signup" className="font-bold text-link hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
