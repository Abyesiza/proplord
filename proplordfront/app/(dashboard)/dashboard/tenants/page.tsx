import Link from "next/link";
import { suspended } from "@/components/skeletons/suspended";
import { redirect } from "next/navigation";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, Td } from "@/components/ui/table";
import { getProperties, getTenants, selectedPropertyId } from "@/lib/data";
import { formatDate, frequencyLabel } from "@/lib/format";
import { isStaff } from "@/lib/roles";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Tenants | Proplord" };

export default suspended(TenantsPage);

async function TenantsPage({ searchParams }: PageProps<"/dashboard/tenants">) {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/dashboard");

  const propertyId = await selectedPropertyId(searchParams);
  const [members, properties] = await Promise.all([getTenants(propertyId), getProperties()]);
  const propertyName = new Map(properties.map((p) => [p.id, p.name]));

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Tenants"
        description="Everyone with access to your properties."
      />
      <Card>
        {members.length === 0 ? (
          <EmptyState
            title="No tenants yet"
            description="Open a property and invite tenants by email or create a login for them."
          />
        ) : (
          <Table headers={["Tenant", "Property", "Unit", "Pays", "Since", "Status"]}>
            {members.map((m) => (
              <tr key={m.id}>
                <Td className="font-semibold">
                  {m.profile?.fullName ?? m.profile?.username ?? "Unknown"}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {m.profile?.email ?? (m.profile?.username && `@${m.profile.username}`)}
                  </span>
                </Td>
                <Td>
                  <Link
                    href={`/dashboard/properties/${m.propertyId}?tab=tenants`}
                    className="font-semibold text-link hover:underline"
                  >
                    {propertyName.get(m.propertyId) ?? "Property"}
                  </Link>
                </Td>
                <Td>{m.unit?.name ?? "Unassigned"}</Td>
                <Td>
                  <Badge variant="outline">{frequencyLabel(m.paymentFrequency)}</Badge>
                </Td>
                <Td>{formatDate(m.createdAt)}</Td>
                <Td>
                  <StatusBadge status={m.status} />
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
