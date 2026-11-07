import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, Td } from "@/components/ui/table";
import { formatDate, humanize, money, personName } from "@/lib/format";
import type { Payment } from "@/lib/types";

export function RecentPaymentsCard({
  payments,
  currency,
}: {
  payments: Payment[];
  currency: string;
}) {
  return (
    <Card>
      <CardHeader
        title="Recent payments"
        description="Latest money received"
        action={
          <Link href="/dashboard/receipts" className="text-sm font-semibold text-link hover:underline">
            All receipts
          </Link>
        }
      />
      {payments.length === 0 ? (
        <EmptyState title="No payments yet" description="Recorded payments will show up here." />
      ) : (
        <Table headers={["From", "Date", "Method", "Amount", ""]}>
          {payments.map((p) => (
            <tr key={p.id}>
              <Td className="font-semibold">{personName(p.member)}</Td>
              <Td>{formatDate(p.paidAt)}</Td>
              <Td>{humanize(p.method)}</Td>
              <Td className="font-semibold">{money(p.amount, currency)}</Td>
              <Td>
                {p.receipt && (
                  <Link
                    href={`/dashboard/receipts/${p.receipt.id}`}
                    className="font-semibold text-link hover:underline"
                  >
                    {p.receipt.receiptNumber}
                  </Link>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
