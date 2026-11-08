import type { Role } from "./types";

/** Landlords and caretakers work with a property's payments; tenants only see their own. */
export const isStaff = (role: Role) => role === "landlord" || role === "caretaker";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Platform admin",
  landlord: "Landlord",
  caretaker: "Caretaker",
  tenant: "Tenant",
};
