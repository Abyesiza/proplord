import { redirect } from "next/navigation";
import { createProperty } from "@/actions/manage";
import { ActionForm } from "@/components/ui/action-form";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Add property | Proplord" };

export default async function NewPropertyPage() {
  const user = await requireUser();
  if (user.role !== "landlord") redirect("/dashboard/properties");

  return (
    <>
      <PageHeader eyebrow="Properties" title="Add a property" description="You can add units and tenants next." />
      <Card className="max-w-2xl">
        <ActionForm action={createProperty} submitLabel="Create property">
          <Field label="Property name" name="name" placeholder="Sunset Heights" />
          <Field label="Address" name="addressLine" required={false} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" name="city" required={false} />
            <Field label="State / region" name="state" required={false} />
            <Field label="Country" name="country" required={false} />
            <Field
              label="Currency"
              name="currency"
              defaultValue="USD"
              hint="3-letter code, e.g. USD, KES, UGX"
            />
          </div>
          <Field label="Description" name="description" required={false} />
        </ActionForm>
      </Card>
    </>
  );
}
