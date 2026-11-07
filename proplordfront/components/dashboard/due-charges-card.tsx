import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { Table, Td } from "@/components/ui/table";
import { formatDate, money, personName } from "@/lib/format";
import type { Charge } from "@/lib/types";

type Row = Charge & { balance: number };

export function DueChargesCard({
  charges,
  currency,
  showTenant,
}: {
  charges: Row[];
  currency: string;
  showTenant: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title={showTenant ? "Due soon" : "What you owe"}
        description="Unpaid charges, earliest due date first"
        action={
          <Link href="/dashboard/payments" className="text-sm font-semibold text-link hover:underline">
            View all
          </Link>
        }
      />
      {charges.length === 0 ? (
        <EmptyState title="All caught up" description="No unpaid charges right now." />
      ) : (
        <Table headers={[showTenant ? "Tenant" : "Charge", "Due", "Balance", "Status"]}>
          {charges.map((c) => (
            <tr key={c.id}>
              <Td className="font-semibold">
                {showTenant ? (
                  <>
                    {personName(c.member)}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {c.description}
                    </span>
                  </>
                ) : (
                  c.description
                )}
              </Td>
              <Td>{formatDate(c.dueDate)}</Td>
              <Td className="font-semibold">{money(c.balance, currency)}</Td>
              <Td>
                <StatusBadge status={c.status} />
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
