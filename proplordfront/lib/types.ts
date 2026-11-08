export type Role = "admin" | "landlord" | "caretaker" | "tenant";

export type Frequency = "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual";

export type TermClause = { title: string; body: string; required: boolean };

export type Terms = {
  enabled: boolean;
  isDefault: boolean;
  version: string;
  clauses: TermClause[];
  /** Set for tenants only. */
  acceptance: { accepted: boolean; acceptedAt: string | null } | null;
};

export type TermsAcceptances = {
  version: string;
  tenants: { memberId: string; name: string; unit: string | null; acceptedAt: string | null }[];
};

export type AdminStats = {
  currency: string;
  otherCurrencies: string[];
  totals: {
    landlords: number;
    caretakers: number;
    tenants: number;
    properties: number;
    units: number;
    collectedAllTime: number;
    collectedThisMonth: number;
    outstanding: number;
  };
  monthly: {
    month: string;
    collected: number;
    newLandlords: number;
    newProperties: number;
    newTenants: number;
  }[];
  byType: { label: string; count: number }[];
  byLocation: { city: string; country: string; properties: number; units: number }[];
  byMethod: { label: string; amount: number }[];
};

export type AdminLandlord = {
  id: string;
  fullName: string | null;
  email: string | null;
  createdAt: string;
  properties: number;
  units: number;
  tenants: number;
  collected: number;
};

export type RentTracker = {
  month: string;
  currency: string;
  summary: {
    tenants: number;
    expected: number;
    paid: number;
    outstanding: number;
    paidCount: number;
    prepaidCount: number;
    partialCount: number;
    overdueCount: number;
    pendingCount: number;
  };
  daily: { day: number; expected: number; paid: number }[];
  rows: {
    memberId: string;
    tenantName: string | null;
    unitName: string | null;
    propertyId: string;
    propertyName: string;
    city: string | null;
    landlordName: string | null;
    dueDate: string;
    expected: number;
    paid: number;
    state: "paid" | "prepaid" | "partial" | "overdue" | "pending";
    paidThrough: string | null;
    frequency: Frequency;
  }[];
  truncated: boolean;
};

export type AdminProperty = {
  id: string;
  name: string;
  propertyType: string;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  currency: string;
  createdAt: string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  units: number;
  tenants: number;
  collected: number;
  outstanding: number;
};

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
  role: "tenant" | "caretaker" | "manager";
  status: "active" | "inactive";
  origin: "invite" | "credentials";
  paymentFrequency: Frequency;
  agreedAmount: number | null;
  createdAt: string;
  profile: {
    fullName: string | null;
    email: string | null;
    username: string | null;
    phone: string | null;
  } | null;
  unit: { name: string; rentAmount: number } | null;
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
  frequency: Frequency | null;
  periodStart: string | null;
  periodEnd: string | null;
  periodCount: number | null;
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
    frequency: Frequency | null;
    periodStart: string | null;
    periodEnd: string | null;
    periodCount: number | null;
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
