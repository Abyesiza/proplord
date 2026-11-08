import Link from "next/link";
import { suspended } from "@/components/skeletons/suspended";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, Td } from "@/components/ui/table";
import { getReceipts, selectedPropertyId } from "@/lib/data";
import { formatDate, money, personName } from "@/lib/format";

export const metadata = { title: "Receipts | Proplord" };

export default suspended(ReceiptsPage);

async function ReceiptsPage({ searchParams }: PageProps<"/dashboard/receipts">) {
  const receipts = await getReceipts(await selectedPropertyId(searchParams));

  return (
    <>
      <PageHeader eyebrow="Records" title="Receipts" description="Issued automatically for every completed payment." />
      <Card>
        {receipts.length === 0 ? (
          <EmptyState title="No receipts yet" description="Receipts appear here once a payment is recorded." />
        ) : (
          <Table headers={["Receipt", "Date", "Tenant", "Property", "Amount", ""]}>
            {receipts.map((r) => (
              <tr key={r.id}>
                <Td className="font-semibold">{r.receiptNumber}</Td>
                <Td>{formatDate(r.issuedAt)}</Td>
                <Td>{personName(r.payment?.member)}</Td>
                <Td>{r.property?.name}</Td>
                <Td className="font-semibold">
                  {r.payment && money(r.payment.amount, r.property?.currency)}
                </Td>
                <Td className="text-right">
                  <Link href={`/dashboard/receipts/${r.id}`} className="font-semibold text-link hover:underline">
                    View
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
