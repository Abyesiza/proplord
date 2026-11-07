import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { formatDate, humanize, money, personName } from "@/lib/format";
import type { Payment } from "@/lib/types";

export function PaymentsTable({
  payments,
  currency,
  showTenant,
}: {
  payments: Payment[];
  currency: string;
  showTenant: boolean;
}) {
  return (
    <Table headers={[...(showTenant ? ["Tenant"] : []), "Date", "For", "Method", "Amount", "Status", "Receipt"]}>
      {payments.map((p) => (
        <tr key={p.id}>
          {showTenant && <Td className="font-semibold">{personName(p.member)}</Td>}
          <Td>{formatDate(p.paidAt)}</Td>
          <Td>{p.charge?.description ?? "General payment"}</Td>
          <Td>{humanize(p.method)}</Td>
          <Td className="font-semibold">{money(p.amount, currency)}</Td>
          <Td>
            <StatusBadge status={p.status} />
          </Td>
          <Td>
            {p.receipt && (
              <Link href={`/dashboard/receipts/${p.receipt.id}`} className="font-semibold text-link hover:underline">
                {p.receipt.receiptNumber}
              </Link>
            )}
          </Td>
        </tr>
      ))}
    </Table>
  );
}
