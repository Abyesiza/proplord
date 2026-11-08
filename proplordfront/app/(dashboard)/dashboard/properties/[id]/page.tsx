import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { getProperty, getTerms } from "@/lib/data";
import { location, propertyTypeLabel } from "@/lib/format";
import { isStaff } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import type { Role } from "@/lib/types";
import { BillingTab } from "./billing-tab";
import { CaretakersTab } from "./caretakers-tab";
import { TenantsTab } from "./tenants-tab";
import { TermsTab } from "./terms-tab";
import { UnitsTab } from "./units-tab";

const TABS: { id: string; label: string; roles: Role[] }[] = [
  { id: "units", label: "Units", roles: ["landlord"] },
  { id: "tenants", label: "Tenants", roles: ["landlord", "caretaker"] },
  { id: "caretakers", label: "Caretakers", roles: ["landlord"] },
  { id: "billing", label: "Billing", roles: ["landlord", "caretaker", "tenant"] },
  { id: "terms", label: "Terms", roles: ["landlord", "caretaker", "tenant"] },
];

export default function PropertyPage(props: PageProps<"/dashboard/properties/[id]">) {
  return (
    <>
      <Link
        href="/dashboard/properties"
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to properties
      </Link>
      <Suspense fallback={<PageSkeleton />}>
        <Property params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Property({
  params,
  searchParams,
}: PageProps<"/dashboard/properties/[id]">) {
  const [{ id }, { tab }, user] = await Promise.all([params, searchParams, requireUser()]);
  const landlord = user.role === "landlord";

  const property = await getProperty(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });

  const tabs = TABS.filter((t) => t.roles.includes(user.role));
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  const pendingTerms =
    user.role === "tenant" && active.id !== "terms"
      ? await getTerms(id)
          .then((t) => t.enabled && t.clauses.length > 0 && t.acceptance?.accepted === false)
          .catch(() => false)
      : false;

  return (
    <>
      <PageHeader
        eyebrow="Property"
        title={property.name}
        description={location(property)}
        actions={
          <div className="flex gap-2">
            <Badge variant="outline">{propertyTypeLabel(property.propertyType)}</Badge>
            <Badge variant="outline">{property.currency}</Badge>
          </div>
        }
      />

      {pendingTerms && (
        <p
          role="status"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
        >
          Please read and accept the terms and conditions for this property.
          <Link href={`/dashboard/properties/${id}?tab=terms`} className="underline">
            Review terms
          </Link>
        </p>
      )}

      <nav aria-label="Property sections" className="mb-6 flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 sm:inline-flex sm:w-auto">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/properties/${id}?tab=${t.id}`}
            aria-current={t.id === active.id ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-colors sm:flex-none focus-visible:outline-2 focus-visible:outline-ring",
              t.id === active.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {active.id === "units" && <UnitsTab property={property} />}
      {active.id === "tenants" && <TenantsTab property={property} canManage={landlord} />}
      {active.id === "caretakers" && <CaretakersTab property={property} />}
      {active.id === "billing" && (
        <BillingTab property={property} staff={isStaff(user.role)} landlord={landlord} />
      )}
      {active.id === "terms" && <TermsTab property={property} role={user.role} />}
    </>
  );
}
