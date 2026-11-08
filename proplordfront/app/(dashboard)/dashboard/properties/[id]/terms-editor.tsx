"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { resetTerms, saveTerms, type TermsResult } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { Terms } from "@/lib/types";

type Row = Terms["clauses"][number] & { key: number };

// Stable keys so edited rows keep their identity when others are removed.
let keySeed = 0;
const toRows = (terms: Terms): Row[] => terms.clauses.map((clause) => ({ ...clause, key: keySeed++ }));

const input =
  "w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20";

export function TermsEditor({ propertyId, initial }: { propertyId: string; initial: Terms }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [isDefault, setIsDefault] = useState(initial.isDefault);
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));
  const [note, setNote] = useState<{ error?: string; message?: string }>();
  const [pending, startTransition] = useTransition();

  const patch = (key: number, change: Partial<Row>) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...change } : r)));

  function finish(result: TermsResult, message: string) {
    if (result.error) return setNote({ error: result.error });
    if (result.terms) {
      setEnabled(result.terms.enabled);
      setIsDefault(result.terms.isDefault);
      setRows(toRows(result.terms));
    }
    setNote({ message });
  }

  const save = () =>
    startTransition(async () => {
      setNote(undefined);
      const clauses = rows.map(({ title, body, required }) => ({ title, body, required }));
      finish(await saveTerms(propertyId, { enabled, clauses }), "Terms saved");
    });

  const reset = () => {
    if (!window.confirm("Replace your terms with the default set? Your edits will be lost.")) return;
    startTransition(async () => {
      setNote(undefined);
      finish(await resetTerms(propertyId), "Default terms restored");
    });
  };

  return (
    <Card>
      <CardHeader
        title="Terms and conditions"
        description={
          isDefault
            ? "These are the default terms. Edit anything, add your own rules or remove what doesn't apply."
            : "Your own terms for this property."
        }
      />

      <label className="mb-6 flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-5 accent-primary"
        />
        Show these terms to tenants
      </label>

      <ol className="space-y-4">
        {rows.map((row, i) => (
          <li key={row.key} className="rounded-md border border-border p-4">
            <div className="flex items-start gap-3">
              <span className="mt-2 text-sm font-black text-muted-foreground">{i + 1}.</span>
              <div className="min-w-0 flex-1 space-y-3">
                <input
                  aria-label={`Clause ${i + 1} title`}
                  className={input}
                  value={row.title}
                  maxLength={120}
                  placeholder="Title, e.g. Rent payment"
                  onChange={(e) => patch(row.key, { title: e.target.value })}
                />
                <textarea
                  aria-label={`Clause ${i + 1} text`}
                  className={`${input} min-h-24`}
                  value={row.body}
                  maxLength={2000}
                  placeholder="What the tenant must know or follow"
                  onChange={(e) => patch(row.key, { body: e.target.value })}
                />
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.required}
                    onChange={(e) => patch(row.key, { required: e.target.checked })}
                    className="size-4 accent-primary"
                  />
                  Required (untick to make it a guideline)
                </label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove clause ${i + 1}`}
                onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setRows((current) => [
              ...current,
              { key: keySeed++, title: "", body: "", required: true },
            ])
          }
        >
          <Plus className="size-4" aria-hidden /> Add clause
        </Button>
        {!isDefault && (
          <Button type="button" variant="ghost" onClick={reset} disabled={pending}>
            Reset to default
          </Button>
        )}
        <Button type="button" className="sm:ml-auto" onClick={save} disabled={pending}>
          {pending ? "Please wait..." : "Save terms"}
        </Button>
      </div>

      {note?.error && (
        <p role="alert" className="mt-4 rounded-md bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground">
          {note.error}
        </p>
      )}
      {note?.message && (
        <p role="status" className="mt-4 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground">
          {note.message}
        </p>
      )}
    </Card>
  );
}
