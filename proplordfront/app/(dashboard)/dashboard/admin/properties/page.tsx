import { Card } from "@/components/ui/card";
import { suspended } from "@/components/skeletons/suspended";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, Td } from "@/components/ui/table";
import { getAdminProperties } from "@/lib/data";
import { money, propertyTypeLabel } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "All properties | Proplord" };

export default suspended(AllPropertiesPage);

async function AllPropertiesPage() {
  await requireAdmin();
  const properties = await getAdminProperties();

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="All properties"
        description={`${properties.length} ${properties.length === 1 ? "property" : "properties"} across every landlord.`}
      />
      <Card>
        {properties.length === 0 ? (
          <EmptyState title="No properties yet" />
        ) : (
          <Table headers={["Property", "Location", "Landlord", "Units", "Tenants", "Collected", "Outstanding"]}>
            {properties.map((p) => (
              <tr key={p.id}>
                <Td className="font-semibold">
                  {p.name}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {propertyTypeLabel(p.propertyType)}
                  </span>
                </Td>
                <Td>{[p.city, p.state, p.country].filter(Boolean).join(", ") || "Not set"}</Td>
                <Td>
                  {p.ownerName ?? "Unnamed"}
                  <span className="block text-xs text-muted-foreground">{p.ownerEmail}</span>
                </Td>
                <Td>{p.units}</Td>
                <Td>{p.tenants}</Td>
                <Td className="font-semibold">{money(p.collected, p.currency)}</Td>
                <Td>{money(p.outstanding, p.currency)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
