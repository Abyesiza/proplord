import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { api, ApiError } from "./api";
import { getToken } from "./session";
import type {
  Charge,
  Invitation,
  Member,
  Payment,
  Property,
  PropertyDetail,
  Receipt,
  Summary,
} from "./types";

/** Authenticated read; a dead session sends the visitor back to log in. */
export async function apiAuthed<T>(path: string): Promise<T> {
  const token = await getToken();
  if (!token) redirect("/login");
  try {
    return await api<T>(path, { token });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/login");
    throw err;
  }
}

const qs = (params: Record<string, string | undefined>) => {
  const query = new URLSearchParams(
    Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])),
  ).toString();
  return query ? `?${query}` : "";
};

export const getSummary = cache(() => apiAuthed<Summary>("/dashboard/summary"));
export const getProperties = cache(() => apiAuthed<Property[]>("/properties"));
export const getProperty = cache((id: string) =>
  apiAuthed<PropertyDetail>(`/properties/${id}`),
);
export const getMembers = (propertyId?: string) =>
  apiAuthed<Member[]>(`/members${qs({ propertyId })}`);
export const getInvitations = (propertyId: string) =>
  apiAuthed<Invitation[]>(`/properties/${propertyId}/invitations`);
export const getCharges = (propertyId?: string) =>
  apiAuthed<Charge[]>(`/charges${qs({ propertyId })}`);
export const getPayments = (propertyId?: string) =>
  apiAuthed<Payment[]>(`/payments${qs({ propertyId })}`);
export const getReceipts = () => apiAuthed<Receipt[]>("/receipts");
export const getReceipt = (id: string) => apiAuthed<Receipt>(`/receipts/${id}`);
