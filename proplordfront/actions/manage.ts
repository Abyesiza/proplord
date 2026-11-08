"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import type { FormState } from "@/lib/form-state";
import { getToken } from "@/lib/session";
import type { Payment, Property, TermClause, Terms } from "@/lib/types";

const text = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
const optional = (data: FormData, name: string) => text(data, name) || undefined;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Never redirects, so callers can return the message to the form. */
async function call<T>(path: string, method: string, body?: unknown): Promise<Result<T>> {
  const token = await getToken();
  if (!token) return { ok: false, error: "Your session expired. Please log in again." };
  try {
    return { ok: true, data: await api<T>(path, { method, body, token }) };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

const propertyPath = (id: string) => `/dashboard/properties/${id}`;

async function saveInProperty(
  propertyId: string,
  path: string,
  body: unknown,
  message: string,
): Promise<FormState> {
  const result = await call(path, "POST", body);
  if (!result.ok) return { error: result.error };
  revalidatePath(propertyPath(propertyId));
  return { ok: true, message };
}

export async function createProperty(_: FormState, data: FormData): Promise<FormState> {
  const result = await call<Property>("/properties", "POST", {
    name: text(data, "name"),
    propertyType: optional(data, "propertyType"),
    unitCount: Number(text(data, "unitCount") || 0),
    unitLabel: optional(data, "unitLabel"),
    defaultRent: optional(data, "defaultRent") && Number(text(data, "defaultRent")),
    description: optional(data, "description"),
    addressLine: optional(data, "addressLine"),
    city: optional(data, "city"),
    state: optional(data, "state"),
    country: optional(data, "country"),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/dashboard/properties");
  redirect(propertyPath(result.data.id));
}

export async function createUnit(
  propertyId: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  return saveInProperty(
    propertyId,
    `/properties/${propertyId}/units`,
    { name: text(data, "name"), rentAmount: Number(text(data, "rentAmount")) },
    "Unit added",
  );
}

export async function updateUnit(
  propertyId: string,
  unitId: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  const result = await call(`/units/${unitId}`, "PATCH", {
    name: text(data, "name"),
    rentAmount: Number(text(data, "rentAmount")),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(propertyPath(propertyId));
  return { ok: true, message: "Unit updated" };
}

export async function createCaretakerLogin(
  propertyId: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  const username = text(data, "username");
  return saveInProperty(
    propertyId,
    `/properties/${propertyId}/members`,
    {
      role: "caretaker",
      fullName: text(data, "fullName"),
      username,
      password: String(data.get("password") ?? ""),
    },
    `Caretaker login created. Give ${username.toLowerCase()} their username and password.`,
  );
}

export async function updateTenantPlan(
  propertyId: string,
  memberId: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  const agreed = text(data, "agreedAmount");
  const result = await call(`/members/${memberId}`, "PATCH", {
    unitId: text(data, "unitId") || null,
    paymentFrequency: text(data, "paymentFrequency"),
    agreedAmount: agreed ? Number(agreed) : null,
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(propertyPath(propertyId));
  return { ok: true, message: "Tenant updated" };
}

export type TermsResult = { error?: string; terms?: Terms };

export async function saveTerms(
  propertyId: string,
  input: { enabled: boolean; clauses: TermClause[] },
): Promise<TermsResult> {
  const result = await call<Terms>(`/properties/${propertyId}/terms`, "PUT", input);
  if (!result.ok) return { error: result.error };
  revalidatePath(propertyPath(propertyId));
  return { terms: result.data };
}

export async function resetTerms(propertyId: string): Promise<TermsResult> {
  const result = await call<Terms>(`/properties/${propertyId}/terms/reset`, "POST");
  if (!result.ok) return { error: result.error };
  revalidatePath(propertyPath(propertyId));
  return { terms: result.data };
}

export async function inviteTenant(
  propertyId: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  const result = await call<{ inviteUrl: string }>(
    `/properties/${propertyId}/invitations`,
    "POST",
    { email: text(data, "email"), unitId: optional(data, "unitId") },
  );
  if (!result.ok) return { error: result.error };
  revalidatePath(propertyPath(propertyId));
  return { ok: true, message: `Share this invite link: ${result.data.inviteUrl}` };
}

export async function createTenantLogin(
  propertyId: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  const username = text(data, "username");
  return saveInProperty(
    propertyId,
    `/properties/${propertyId}/members`,
    {
      fullName: text(data, "fullName"),
      username,
      password: String(data.get("password") ?? ""),
      unitId: optional(data, "unitId"),
    },
    `Login created. Give ${username.toLowerCase()} their username and password.`,
  );
}

export async function createCharge(
  propertyId: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  return saveInProperty(
    propertyId,
    `/properties/${propertyId}/charges`,
    {
      memberId: text(data, "memberId"),
      description: text(data, "description"),
      amount: Number(text(data, "amount")),
      dueDate: text(data, "dueDate"),
    },
    "Charge created",
  );
}

export async function recordPayment(
  propertyId: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  // A chosen charge is submitted as "chargeId:memberId" so the tenant always matches it.
  const [chargeId, chargeMember] = text(data, "charge").split(":");
  const covers = text(data, "coverage") === "periods";
  const start = text(data, "periodStart");
  const result = await call<Payment>(`/properties/${propertyId}/payments`, "POST", {
    memberId: chargeMember || text(data, "memberId"),
    chargeId: chargeId || undefined,
    amount: Number(text(data, "amount")),
    method: text(data, "method"),
    reference: optional(data, "reference"),
    note: optional(data, "note"),
    // Month pickers send YYYY-MM; the API wants a full date.
    periodStart: covers ? (start.length === 7 ? `${start}-01` : start) : undefined,
    periodCount: covers ? Number(text(data, "periodCount")) : undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard", "layout");
  const receiptId = result.data.receipt?.id;
  if (receiptId) redirect(`/dashboard/receipts/${receiptId}`);
  return { ok: true, message: "Payment recorded" };
}

async function mutate(propertyId: string, path: string, method: string) {
  await call(path, method);
  revalidatePath(propertyPath(propertyId));
}

export async function deleteUnit(propertyId: string, unitId: string) {
  await mutate(propertyId, `/units/${unitId}`, "DELETE");
}

export async function removeMember(propertyId: string, memberId: string) {
  await mutate(propertyId, `/members/${memberId}`, "DELETE");
}

export async function revokeInvitation(propertyId: string, invitationId: string) {
  await mutate(propertyId, `/invitations/${invitationId}`, "DELETE");
}

export async function cancelCharge(propertyId: string, chargeId: string) {
  await mutate(propertyId, `/charges/${chargeId}/cancel`, "POST");
}

export async function acceptTerms(propertyId: string) {
  await mutate(propertyId, `/properties/${propertyId}/terms/accept`, "POST");
}
