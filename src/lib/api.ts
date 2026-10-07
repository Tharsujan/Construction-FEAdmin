import type { ApiEnvelope } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
export const TOKEN_KEY = "siteworks.admin.token";
export const DENIED_KEY = "siteworks.admin.denied";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth && typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("The yard API is not reachable. Check that it is running on port 5205.", 0);
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  if (!response.ok || !body?.success) {
    throw new ApiError(body?.message || "The request could not be completed.", response.status);
  }

  return body.data;
}

export function send<T>(path: string, method: string, body?: unknown) {
  return api<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
