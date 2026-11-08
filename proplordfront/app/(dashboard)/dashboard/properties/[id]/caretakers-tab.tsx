import { Trash2 } from "lucide-react";
import { createCaretakerLogin, removeMember } from "@/actions/manage";
import { ActionForm } from "@/components/ui/action-form";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/form";
import { Table, Td } from "@/components/ui/table";
import { getCaretakers } from "@/lib/data";
import type { PropertyDetail } from "@/lib/types";

export async function CaretakersTab({ property }: { property: PropertyDetail }) {
  const caretakers = await getCaretakers(property.id);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Caretakers"
          description="They can see tenants, charges and payments here, raise charges and record payments. They cannot edit the property, units or terms."
        />
        {caretakers.length === 0 ? (
          <EmptyState title="No caretakers yet" description="Create a login for the person who looks after this property." />
        ) : (
          <Table headers={["Caretaker", "Username", "Status", ""]}>
            {caretakers.map((c) => (
              <tr key={c.id}>
                <Td className="font-semibold">{c.profile?.fullName ?? "Unknown"}</Td>
                <Td>{c.profile?.username && `@${c.profile.username}`}</Td>
                <Td>
                  <StatusBadge status={c.status} />
                </Td>
                <Td className="text-right">
                  <form action={removeMember.bind(null, property.id, c.id)}>
                    <Button variant="ghost" size="sm" aria-label="Remove caretaker">
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
        <CardHeader title="Create a caretaker login" description="Share the username and password with them." />
        <ActionForm action={createCaretakerLogin.bind(null, property.id)} submitLabel="Create caretaker" columns={2}>
          <Field label="Full name" name="fullName" autoComplete="off" />
          <Field label="Username" name="username" autoComplete="off" hint="3-32 characters: a-z, 0-9, _ . -" />
          <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} hint="At least 8 characters" />
        </ActionForm>
      </Card>
    </div>
  );
}
