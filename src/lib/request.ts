import { deviceHeaders } from "./device";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const API_BASE = ((import.meta.env.VITE_KEMIT_API_URL as string | undefined)?.trim() || "https://vpn.nexfyr.com").replace(/\/$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
};

export async function publicRequest<T>(apiBase: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...deviceHeaders() };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch {
    throw new ApiError("We couldn't reach KemitVPN. Check your connection and try again.", 0, "NETWORK_ERROR");
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const body = data as { message?: string; code?: string; details?: unknown };
    throw new ApiError(body.message || "Something went wrong.", response.status, body.code || "REQUEST_FAILED", body.details);
  }
  return data as T;
}
