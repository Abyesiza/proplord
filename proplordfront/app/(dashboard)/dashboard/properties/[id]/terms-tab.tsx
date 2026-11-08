import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/form";
import { Table, Td } from "@/components/ui/table";
import { acceptTerms } from "@/actions/manage";
import { getTerms, getTermsAcceptances } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { PropertyDetail, Role, Terms } from "@/lib/types";
import { TermsEditor } from "./terms-editor";

export async function TermsTab({ property, role }: { property: PropertyDetail; role: Role }) {
  const terms = await getTerms(property.id);
  const landlord = role === "landlord";
  const staff = landlord || role === "caretaker";

  return (
    <div className="space-y-5">
      {landlord ? (
        <TermsEditor propertyId={property.id} initial={terms} />
      ) : (
        <TermsReader property={property} terms={terms} />
      )}
      {staff && terms.enabled && <Acceptances propertyId={property.id} />}
    </div>
  );
}

function TermsReader({ property, terms }: { property: PropertyDetail; terms: Terms }) {
  if (!terms.enabled || terms.clauses.length === 0) {
    return (
      <Card>
        <EmptyState title="No terms for this property" description="The landlord has not set any terms and conditions." />
      </Card>
    );
  }

  const { acceptance } = terms;

  return (
    <Card>
      <CardHeader title="Terms and conditions" description={`The rules for living at ${property.name}.`} />
      <ol className="space-y-5">
        {terms.clauses.map((clause, i) => (
          <li key={i}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold">
                {i + 1}. {clause.title}
              </h3>
              <Badge variant={clause.required ? "default" : "outline"}>
                {clause.required ? "Required" : "Guideline"}
              </Badge>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{clause.body}</p>
          </li>
        ))}
      </ol>

      {acceptance && (
        <div className="mt-8 border-t border-border pt-6">
          {acceptance.accepted ? (
            <p role="status" className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground">
              You accepted these terms
              {acceptance.acceptedAt ? ` on ${formatDate(acceptance.acceptedAt)}` : ""}.
            </p>
          ) : (
            <form action={acceptTerms.bind(null, property.id)} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                By accepting, you agree to follow these terms while you live at {property.name}.
              </p>
              <SubmitButton fullWidth={false}>I accept these terms</SubmitButton>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}

async function Acceptances({ propertyId }: { propertyId: string }) {
  const { tenants } = await getTermsAcceptances(propertyId);
  const accepted = tenants.filter((t) => t.acceptedAt).length;

  return (
    <Card>
      <CardHeader
        title="Tenant acceptance"
        description={`${accepted} of ${tenants.length} accepted. Tenants are asked to accept again whenever the terms change.`}
      />
      {tenants.length === 0 ? (
        <EmptyState title="No tenants yet" />
      ) : (
        <Table headers={["Tenant", "Unit", "Status"]}>
          {tenants.map((t) => (
            <tr key={t.memberId}>
              <Td className="font-semibold">{t.name}</Td>
              <Td>{t.unit ?? "Unassigned"}</Td>
              <Td>
                {t.acceptedAt ? (
                  <span className="flex items-center gap-2">
                    <StatusBadge status="accepted" />
                    <span className="text-xs text-muted-foreground">{formatDate(t.acceptedAt)}</span>
                  </span>
                ) : (
                  <StatusBadge status="pending" />
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
