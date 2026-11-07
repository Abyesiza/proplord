import { Trash2 } from "lucide-react";
import { createUnit, deleteUnit } from "@/actions/manage";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/form";
import { Table, Td } from "@/components/ui/table";
import { money } from "@/lib/format";
import type { PropertyDetail } from "@/lib/types";

export function UnitsTab({ property }: { property: PropertyDetail }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <Card>
        <CardHeader title="Units" description="Apartments, rooms or shops in this property" />
        {property.units.length === 0 ? (
          <EmptyState title="No units yet" description="Add a unit to assign tenants and rent." />
        ) : (
          <Table headers={["Unit", "Monthly rent", ""]}>
            {property.units.map((unit) => (
              <tr key={unit.id}>
                <Td className="font-semibold">{unit.name}</Td>
                <Td>{money(unit.rentAmount, property.currency)}</Td>
                <Td className="text-right">
                  <form action={deleteUnit.bind(null, property.id, unit.id)}>
                    <Button variant="ghost" size="sm" aria-label={`Delete unit ${unit.name}`}>
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </form>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Add a unit" />
        <ActionForm action={createUnit.bind(null, property.id)} submitLabel="Add unit">
          <Field label="Unit name" name="name" placeholder="Unit 4B" />
          <Field label="Monthly rent" name="rentAmount" type="number" step="0.01" min="0" />
        </ActionForm>
      </Card>
    </div>
  );
}
