import Link from "next/link";
import { Suspense } from "react";
import { api, ApiError } from "@/lib/api";
import { getUser } from "@/lib/session";
import { AuthShell } from "@/components/auth-shell";
import { InviteForm } from "./invite-form";

export const metadata = { title: "Join a property | Proplord" };

type Preview = {
  email: string;
  propertyName: string | null;
  unitName: string | null;
  valid: boolean;
  hasAccount: boolean;
};

export default function InvitePage(props: PageProps<"/invite/[token]">) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Invite params={props.params} />
    </Suspense>
  );
}

async function Invite({
  params,
}: {
  params: PageProps<"/invite/[token]">["params"];
}) {
  const { token } = await params;

  let invite: Preview | null = null;
  try {
    invite = await api<Preview>(`/invitations/preview/${encodeURIComponent(token)}`);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) throw err;
  }

  if (!invite || !invite.valid) {
    return (
      <AuthShell
        title="Invitation unavailable"
        subtitle="This link is invalid, expired or already used. Ask your landlord for a new one."
        footer={<Link href="/login" className="font-bold text-link hover:underline">Go to log in</Link>}
      >
        <span />
      </AuthShell>
    );
  }

  const user = await getUser();
  const place = invite.unitName
    ? `${invite.propertyName} (${invite.unitName})`
    : invite.propertyName;

  return (
    <AuthShell
      title={`Join ${place}`}
      subtitle={`This invitation was sent to ${invite.email}.`}
    >
      {user || !invite.hasAccount ? (
        <InviteForm token={token} needsAccount={!user} />
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
          className="block rounded-full bg-primary px-7 py-3.5 text-center font-bold text-primary-foreground"
        >
          Log in to accept
        </Link>
      )}
    </AuthShell>
  );
}
