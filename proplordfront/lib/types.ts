export type Role = "landlord" | "tenant";

export type Who = {
  id: string;
  unit: { name: string } | null;
  profile: { fullName: string | null; username: string | null } | null;
};

export type Property = {
  id: string;
  name: string;
  description: string | null;
  propertyType: string;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  currency: string;
  createdAt: string;
  units: { count: number }[];
};

export type Unit = {
  id: string;
  propertyId: string;
  name: string;
  rentAmount: number;
};

export type PropertyDetail = Omit<Property, "units"> & { units: Unit[] };

export type Member = {
  id: string;
  propertyId: string;
  userId: string;
  unitId: string | null;
  role: "tenant" | "manager";
  status: "active" | "inactive";
  origin: "invite" | "credentials";
  createdAt: string;
  profile: {
    fullName: string | null;
    email: string | null;
    username: string | null;
    phone: string | null;
  } | null;
  unit: { name: string } | null;
};

export type Invitation = {
  id: string;
  propertyId: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
};

export type ChargeStatus = "pending" | "partial" | "paid" | "overdue" | "cancelled";

export type Charge = {
  id: string;
  propertyId: string;
  memberId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: ChargeStatus;
  member: Who | null;
};

export type Payment = {
  id: string;
  propertyId: string;
  memberId: string;
  amount: number;
  method: string;
  status: "pending" | "completed" | "failed" | "refunded";
  reference: string | null;
  note: string | null;
  paidAt: string;
  member: Who | null;
  charge: { description: string; amount: number; dueDate: string } | null;
  receipt: { id: string; receiptNumber: string; issuedAt: string } | null;
};

export type Receipt = {
  id: string;
  propertyId: string;
  receiptNumber: string;
  issuedAt: string;
  property: {
    name: string;
    addressLine: string | null;
    city: string | null;
    country: string | null;
    currency: string;
  } | null;
  payment: {
    amount: number;
    method: string;
    reference: string | null;
    note: string | null;
    paidAt: string;
    charge: { description: string } | null;
    member: Who | null;
  } | null;
};

export type Summary = {
  currency: string;
  properties: number;
  units: number;
  tenants: number;
  collectedThisMonth: number;
  outstanding: number;
  overdueCount: number;
  dueSoon: (Charge & { balance: number })[];
  recentPayments: Payment[];
};
