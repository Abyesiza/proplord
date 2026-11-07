import { cancelCharge } from "@/actions/manage";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, Td } from "@/components/ui/table";
import { formatDate, money, personName } from "@/lib/format";
import type { Charge } from "@/lib/types";

const CANCELLABLE = ["pending", "partial", "overdue"];

export function ChargesTable({
  charges,
  currency,
  showTenant,
  canCancel = false,
}: {
  charges: Charge[];
  currency: string;
  showTenant: boolean;
  canCancel?: boolean;
}) {
  return (
    <Table headers={[...(showTenant ? ["Tenant"] : []), "Charge", "Due", "Amount", "Status", ...(canCancel ? [""] : [])]}>
      {charges.map((c) => (
        <tr key={c.id}>
          {showTenant && <Td className="font-semibold">{personName(c.member)}</Td>}
          <Td>{c.description}</Td>
          <Td>{formatDate(c.dueDate)}</Td>
          <Td className="font-semibold">{money(c.amount, currency)}</Td>
          <Td>
            <StatusBadge status={c.status} />
          </Td>
          {canCancel && (
            <Td className="text-right">
              {CANCELLABLE.includes(c.status) && (
                <form action={cancelCharge.bind(null, c.propertyId, c.id)}>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </form>
              )}
            </Td>
          )}
        </tr>
      ))}
    </Table>
  );
}
