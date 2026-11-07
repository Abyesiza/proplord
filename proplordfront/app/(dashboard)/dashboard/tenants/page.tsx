import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, Td } from "@/components/ui/table";
import { getMembers, getProperties } from "@/lib/data";
import { formatDate, humanize } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Tenants | Proplord" };

export default async function TenantsPage() {
  const user = await requireUser();
  if (user.role !== "landlord") redirect("/dashboard");

  const [members, properties] = await Promise.all([getMembers(), getProperties()]);
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
          <Table headers={["Tenant", "Property", "Unit", "Joined via", "Since", "Status"]}>
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
                  <Badge variant="outline">{humanize(m.origin)}</Badge>
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
