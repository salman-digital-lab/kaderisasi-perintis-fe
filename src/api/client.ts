import { ApiError, type ApiTarget } from "./errors";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== "false";

const BASE: Record<ApiTarget, string> = {
  web: import.meta.env.VITE_WEB_API ?? "http://localhost:3333/v2",
  admin: import.meta.env.VITE_ADMIN_API ?? "http://localhost:3334/v2",
};

const TOKEN_KEY: Record<ApiTarget, string> = {
  web: "perintis.token.web",
  admin: "perintis.token.admin",
};

export function getToken(target: ApiTarget): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY[target]);
  } catch {
    return null;
  }
}

export function setToken(target: ApiTarget, token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY[target], token);
    else localStorage.removeItem(TOKEN_KEY[target]);
  } catch {
    // Without storage the session lasts until the tab closes.
  }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

/**
 * One request function for both backends. Participants talk to web-be-go,
 * staff to admin-be-go, each with its own session.
 */
export async function request<T>(
  target: ApiTarget,
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken(target);
  if (USE_MOCK) {
    const { mockRequest } = await import("./mock");
    try {
      return await mockRequest<T>(target, method, path, body, token);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401)
        setToken(target, null);
      throw error;
    }
  }
  const res = await fetch(`${BASE[target]}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as {
    message?: string;
    data?: T;
  } | null;
  if (!res.ok) {
    if (res.status === 401) setToken(target, null);
    throw new ApiError(
      res.status,
      json?.message ?? "Terjadi kesalahan. Coba lagi.",
    );
  }
  return (json?.data ?? json) as T;
}

export const web = {
  get: <T>(path: string) => request<T>("web", "GET", path),
  post: <T>(path: string, body?: unknown) =>
    request<T>("web", "POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>("web", "PUT", path, body),
  del: <T>(path: string) => request<T>("web", "DELETE", path),
};

export const admin = {
  get: <T>(path: string) => request<T>("admin", "GET", path),
  post: <T>(path: string, body?: unknown) =>
    request<T>("admin", "POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) =>
    request<T>("admin", "PUT", path, body),
};
