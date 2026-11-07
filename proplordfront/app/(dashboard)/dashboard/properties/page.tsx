import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getProperties } from "@/lib/data";
import { location } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Properties | Proplord" };

export default async function PropertiesPage() {
  const [user, properties] = await Promise.all([requireUser(), getProperties()]);
  const landlord = user.role === "landlord";
  const addButton = (
    <Link href="/dashboard/properties/new" className={buttonStyles()}>
      <Plus className="size-4" aria-hidden /> Add property
    </Link>
  );

  return (
    <>
      <PageHeader
        eyebrow={landlord ? "Portfolio" : "Where you live"}
        title={landlord ? "Properties" : "My home"}
        description={
          landlord
            ? "Every building you manage, with its units, tenants and billing."
            : "The places you have been added to."
        }
        actions={landlord ? addButton : undefined}
      />

      {properties.length === 0 ? (
        <EmptyState
          title={landlord ? "No properties yet" : "No home yet"}
          description={
            landlord
              ? "Add your first property, then invite tenants and start tracking rent."
              : "Ask your landlord for an invite link or login."
          }
          action={landlord ? addButton : undefined}
        />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/properties/${p.id}`}
                className="group block h-full rounded-md border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Building2 className="size-6" aria-hidden />
                </span>
                <h2 className="mt-5 text-xl font-black tracking-tight group-hover:text-link">
                  {p.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{location(p)}</p>
                <div className="mt-5 flex gap-2">
                  <Badge variant="accent">{p.units[0]?.count ?? 0} units</Badge>
                  <Badge variant="outline">{p.currency}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
