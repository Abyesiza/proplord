import Link from "next/link";
import { redirect } from "next/navigation";
import { RecordPaymentForm } from "@/components/dashboard/record-payment-form";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCharges, getMembers, getProperties } from "@/lib/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Record payment | Proplord" };

export default async function RecordPaymentPage({
  searchParams,
}: PageProps<"/dashboard/payments/new">) {
  const [user, { propertyId }, properties] = await Promise.all([
    requireUser(),
    searchParams,
    getProperties(),
  ]);
  if (user.role !== "landlord") redirect("/dashboard/payments");
  if (properties.length === 1 && typeof propertyId !== "string") {
    redirect(`/dashboard/payments/new?propertyId=${properties[0].id}`);
  }

  const property = properties.find((p) => p.id === propertyId);

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="Record a payment"
        description="A receipt is issued automatically."
      />
      {property ? (
        <PropertyForm propertyId={property.id} currency={property.currency} name={property.name} />
      ) : properties.length === 0 ? (
        <EmptyState title="Add a property first" action={<Link href="/dashboard/properties/new" className={buttonStyles()}>Add property</Link>} />
      ) : (
        <Card className="max-w-2xl">
          <CardHeader title="Choose a property" />
          <ul className="flex flex-wrap gap-3">
            {properties.map((p) => (
              <li key={p.id}>
                <Link href={`/dashboard/payments/new?propertyId=${p.id}`} className={buttonStyles({ variant: "outline" })}>
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

async function PropertyForm({
  propertyId,
  currency,
  name,
}: {
  propertyId: string;
  currency: string;
  name: string;
}) {
  const [members, charges] = await Promise.all([getMembers(propertyId), getCharges(propertyId)]);
  return (
    <Card className="max-w-2xl">
      <CardHeader title={name} />
      <RecordPaymentForm propertyId={propertyId} currency={currency} members={members} charges={charges} />
    </Card>
  );
}
