import { Card } from "@/components/ui/card";
import { suspended } from "@/components/skeletons/suspended";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, Td } from "@/components/ui/table";
import { getAdminLandlords, getAdminStats } from "@/lib/data";
import { formatDate, money } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Landlords | Proplord" };

export default suspended(LandlordsPage);

async function LandlordsPage() {
  await requireAdmin();
  const [landlords, { currency }] = await Promise.all([getAdminLandlords(), getAdminStats()]);

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Landlords"
        description={`${landlords.length} ${landlords.length === 1 ? "landlord" : "landlords"} on Proplord, biggest collectors first.`}
      />
      <Card>
        {landlords.length === 0 ? (
          <EmptyState title="No landlords yet" />
        ) : (
          <Table headers={["Landlord", "Joined", "Properties", "Units", "Tenants", "Collected"]}>
            {landlords.map((l) => (
              <tr key={l.id}>
                <Td className="font-semibold">
                  {l.fullName ?? "Unnamed"}
                  <span className="block text-xs font-normal text-muted-foreground">{l.email}</span>
                </Td>
                <Td>{formatDate(l.createdAt)}</Td>
                <Td>{l.properties}</Td>
                <Td>{l.units}</Td>
                <Td>{l.tenants}</Td>
                <Td className="font-semibold">{money(l.collected, currency)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
