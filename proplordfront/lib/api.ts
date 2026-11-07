import "server-only";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; token?: string };

export async function api<T>(
  path: string,
  { method = "GET", body, token }: Options = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const details = payload?.error?.details;
    const message = Array.isArray(details)
      ? details.join(", ")
      : (payload?.error?.message ?? "Something went wrong");
    throw new ApiError(res.status, message);
  }
  return payload.data as T;
}

/** Message safe to show in a form; network failures get a friendly fallback. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Can't reach the server. Please try again.";
}
