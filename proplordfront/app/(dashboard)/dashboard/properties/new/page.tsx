import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { suspended } from "@/components/skeletons/suspended";
import { createProperty } from "@/actions/manage";
import { ActionForm } from "@/components/ui/action-form";
import { Card } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { PROPERTY_TYPES } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Add property | Proplord" };

export default suspended(NewPropertyPage);

async function NewPropertyPage() {
  const user = await requireUser();
  if (user.role !== "landlord") redirect("/dashboard/properties");

  return (
    <>
      <Link
        href="/dashboard/properties"
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to properties
      </Link>
      <PageHeader eyebrow="Properties" title="Add a property" description="Tell us what it is and how many units it has. Rent is in Ugandan shillings (UGX)." />
      <Card>
        <ActionForm action={createProperty} submitLabel="Create property" columns={3}>
          <Field label="Property name" name="name" placeholder="Sunset Heights" />
          <SelectField label="Property type" name="propertyType" options={PROPERTY_TYPES} />
          <Field label="Number of units" name="unitCount" type="number" min="1" max="500" step="1" defaultValue="1" hint="Flats, rooms or shops you rent out" />
          <Field label="Unit name prefix" name="unitLabel" required={false} placeholder="Room" hint="Units become Room 1, Room 2... Blank names them by type" />
          <Field label="Rent per unit (UGX)" name="defaultRent" type="number" min="0" step="1000" required={false} hint="Per month. You can edit each unit later" />
          <Field label="Country" name="country" defaultValue="Uganda" required={false} />
          <Field label="Address" name="addressLine" required={false} />
          <Field label="City / town" name="city" required={false} />
          <Field label="District / region" name="state" required={false} />
          <Field label="Description" name="description" required={false} wide />
        </ActionForm>
      </Card>
    </>
  );
}
