import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { api, ApiError } from "./api";
import { getToken } from "./session";
import type {
  AdminLandlord,
  AdminProperty,
  AdminStats,
  RentTracker,
  Charge,
  Invitation,
  Member,
  Payment,
  Property,
  PropertyDetail,
  Receipt,
  Summary,
  Terms,
  TermsAcceptances,
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

export const getSummary = cache((propertyId?: string) =>
  apiAuthed<Summary>(`/dashboard/summary${qs({ propertyId })}`),
);
export const getProperties = cache(() => apiAuthed<Property[]>("/properties"));
export const getProperty = cache((id: string) =>
  apiAuthed<PropertyDetail>(`/properties/${id}`),
);
export const getMembers = (propertyId?: string) =>
  apiAuthed<Member[]>(`/members${qs({ propertyId })}`);
export const getTenants = async (propertyId?: string) =>
  (await getMembers(propertyId)).filter((m) => m.role === "tenant");
export const getCaretakers = async (propertyId?: string) =>
  (await getMembers(propertyId)).filter((m) => m.role === "caretaker");
export const getTerms = (propertyId: string) =>
  apiAuthed<Terms>(`/properties/${propertyId}/terms`);
export const getTermsAcceptances = (propertyId: string) =>
  apiAuthed<TermsAcceptances>(`/properties/${propertyId}/terms/acceptances`);
export const getAdminStats = () => apiAuthed<AdminStats>("/admin/overview");
export const getAdminLandlords = () => apiAuthed<AdminLandlord[]>("/admin/landlords");
export const getAdminProperties = () => apiAuthed<AdminProperty[]>("/admin/properties");
export const getRentTracker = (month?: string, propertyId?: string) =>
  apiAuthed<RentTracker>(`/dashboard/rent-tracker${qs({ month, propertyId })}`);
export const getInvitations = (propertyId: string) =>
  apiAuthed<Invitation[]>(`/properties/${propertyId}/invitations`);
export const getCharges = (propertyId?: string) =>
  apiAuthed<Charge[]>(`/charges${qs({ propertyId })}`);
export const getPayments = (propertyId?: string) =>
  apiAuthed<Payment[]>(`/payments${qs({ propertyId })}`);
export const getReceipts = (propertyId?: string) =>
  apiAuthed<Receipt[]>(`/receipts${qs({ propertyId })}`);
export const getReceipt = (id: string) => apiAuthed<Receipt>(`/receipts/${id}`);

/** The `?propertyId=` filter, kept only if it names one of the caller's properties. */
export async function selectedPropertyId(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<string | undefined> {
  const { propertyId } = await searchParams;
  if (typeof propertyId !== "string") return undefined;
  const properties = await getProperties();
  return properties.some((p) => p.id === propertyId) ? propertyId : undefined;
}
