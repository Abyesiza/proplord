import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { api } from "./api";

const COOKIE = "pl_session";

export type User = {
  id: string;
  role: "admin" | "landlord" | "caretaker" | "tenant";
  fullName: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
};

export type SessionPayload = {
  session: { accessToken: string; refreshToken: string; expiresIn: number };
  user: User;
};

export async function startSession({ session }: SessionPayload) {
  (await cookies()).set(COOKIE, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.expiresIn,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function getToken() {
  return (await cookies()).get(COOKIE)?.value;
}

export const getUser = cache(async (): Promise<User | null> => {
  const token = await getToken();
  if (!token) return null;
  try {
    return await api<User>("/auth/me", { token });
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
