import { Trash2 } from "lucide-react";
import {
  createTenantLogin,
  inviteTenant,
  removeMember,
  revokeInvitation,
} from "@/actions/manage";
import { ActionForm } from "@/components/ui/action-form";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SelectField } from "@/components/ui/form";
import { Table, Td } from "@/components/ui/table";
import { getInvitations, getMembers } from "@/lib/data";
import { formatDate, humanize } from "@/lib/format";
import type { PropertyDetail } from "@/lib/types";

export async function TenantsTab({ property }: { property: PropertyDetail }) {
  const [members, invitations] = await Promise.all([
    getMembers(property.id),
    getInvitations(property.id),
  ]);
  const unitOptions = property.units.map((u) => ({ value: u.id, label: u.name }));
  const pending = invitations.filter((i) => i.status === "pending");

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        <Card>
          <CardHeader title="Tenants" description="People with access to this property" />
          {members.length === 0 ? (
            <EmptyState title="No tenants yet" description="Invite someone by email or create a login for them." />
          ) : (
            <Table headers={["Tenant", "Unit", "Joined via", "Status", ""]}>
              {members.map((m) => (
                <tr key={m.id}>
                  <Td className="font-semibold">
                    {m.profile?.fullName ?? m.profile?.username ?? "Unknown"}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {m.profile?.email ?? (m.profile?.username && `@${m.profile.username}`)}
                    </span>
                  </Td>
                  <Td>{m.unit?.name ?? "Unassigned"}</Td>
                  <Td>{humanize(m.origin)}</Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                  <Td className="text-right">
                    <form action={removeMember.bind(null, property.id, m.id)}>
                      <Button variant="ghost" size="sm" aria-label="Remove tenant">
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </form>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        {pending.length > 0 && (
          <Card>
            <CardHeader title="Pending invitations" />
            <Table headers={["Email", "Expires", ""]}>
              {pending.map((i) => (
                <tr key={i.id}>
                  <Td className="font-semibold">{i.email}</Td>
                  <Td>{formatDate(i.expiresAt)}</Td>
                  <Td className="text-right">
                    <form action={revokeInvitation.bind(null, property.id, i.id)}>
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    </form>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Invite by email" description="They get a link to join and set a password." />
          <ActionForm action={inviteTenant.bind(null, property.id)} submitLabel="Create invite" columns={2}>
            <Field label="Email" name="email" type="email" autoComplete="off" />
            <SelectField label="Unit" name="unitId" required={false} options={unitOptions} emptyLabel="No unit yet" />
          </ActionForm>
        </Card>

        <Card>
          <CardHeader title="Create a login" description="For tenants without email. Share the details with them." />
          <ActionForm action={createTenantLogin.bind(null, property.id)} submitLabel="Create login" columns={2}>
            <Field label="Full name" name="fullName" autoComplete="off" />
            <Field label="Username" name="username" autoComplete="off" hint="3-32 characters: a-z, 0-9, _ . -" />
            <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} hint="At least 8 characters" />
            <SelectField label="Unit" name="unitId" required={false} options={unitOptions} emptyLabel="No unit yet" />
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
