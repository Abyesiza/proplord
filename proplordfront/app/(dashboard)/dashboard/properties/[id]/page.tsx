import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { getProperty } from "@/lib/data";
import { location } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { BillingTab } from "./billing-tab";
import { TenantsTab } from "./tenants-tab";
import { UnitsTab } from "./units-tab";

const TABS = [
  { id: "units", label: "Units", landlordOnly: true },
  { id: "tenants", label: "Tenants", landlordOnly: true },
  { id: "billing", label: "Billing", landlordOnly: false },
] as const;

export default async function PropertyPage({
  params,
  searchParams,
}: PageProps<"/dashboard/properties/[id]">) {
  const [{ id }, { tab }, user] = await Promise.all([params, searchParams, requireUser()]);
  const landlord = user.role === "landlord";

  const property = await getProperty(id).catch((err) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });

  const tabs = TABS.filter((t) => landlord || !t.landlordOnly);
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <>
      <PageHeader
        eyebrow="Property"
        title={property.name}
        description={location(property)}
        actions={<Badge variant="outline">{property.currency}</Badge>}
      />

      <nav aria-label="Property sections" className="mb-6 inline-flex gap-1 rounded-full border border-border bg-card p-1">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/properties/${id}?tab=${t.id}`}
            aria-current={t.id === active.id ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring",
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
      {active.id === "tenants" && <TenantsTab property={property} />}
      {active.id === "billing" && <BillingTab property={property} landlord={landlord} />}
    </>
  );
}
