"use server";

import { redirect } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import type { FormState } from "@/lib/form-state";
import {
  endSession,
  getToken,
  startSession,
  type SessionPayload,
} from "@/lib/session";

const field = (data: FormData, name: string) => String(data.get(name) ?? "");

/** Only allow same-site paths so `next` can't be used as an open redirect. */
function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function login(_: FormState, data: FormData): Promise<FormState> {
  let payload: SessionPayload;
  try {
    payload = await api<SessionPayload>("/auth/login", {
      method: "POST",
      body: {
        identifier: field(data, "identifier"),
        password: field(data, "password"),
      },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  await startSession(payload);
  redirect(safeNext(field(data, "next")));
}

export async function signup(_: FormState, data: FormData): Promise<FormState> {
  if (field(data, "password") !== field(data, "confirm")) {
    return { error: "Passwords do not match" };
  }
  let payload: SessionPayload;
  try {
    payload = await api<SessionPayload>("/auth/signup", {
      method: "POST",
      body: {
        fullName: field(data, "fullName"),
        email: field(data, "email"),
        password: field(data, "password"),
      },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  await startSession(payload);
  redirect("/dashboard");
}

export async function acceptInvite(
  inviteToken: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  const callerToken = await getToken();
  let result: Partial<SessionPayload>;
  try {
    result = await api<Partial<SessionPayload>>("/invitations/accept", {
      method: "POST",
      token: callerToken,
      body: {
        token: inviteToken,
        ...(callerToken
          ? {}
          : {
              fullName: field(data, "fullName"),
              password: field(data, "password"),
            }),
      },
    });
  } catch (err) {
    return { error: errorMessage(err) };
  }
  if (result.session && result.user) await startSession(result as SessionPayload);
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/");
}
