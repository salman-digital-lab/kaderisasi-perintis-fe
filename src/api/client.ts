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

/** Message codes of the existing auth endpoints, shown in Indonesian. */
const CODE_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: "Email belum terdaftar di Kaderisasi Salman.",
  WRONG_PASSWORD: "Email atau kata sandi salah.",
  INVALID_CREDENTIALS: "Email atau kata sandi salah.",
  TOO_MANY_LOGIN_ATTEMPTS:
    "Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.",
  ACCOUNT_INACTIVE: "Akun ini sedang nonaktif.",
  UNAUTHORIZED: "Sesi berakhir. Silakan masuk lagi.",
  FORBIDDEN: "Akunmu tidak punya izin untuk tindakan ini.",
  UNTRUSTED_ORIGIN: "Alamat aplikasi ini belum diizinkan oleh server.",
  GENERAL_ERROR: "Terjadi kesalahan. Coba lagi.",
  GOOGLE_LOGIN_FAILED: "Gagal masuk dengan Google. Coba lagi.",
  GOOGLE_LOGIN_EXPIRED: "Sesi masuk Google kedaluwarsa. Ulangi dari awal.",
  GOOGLE_LOGIN_CANCELLED: "Masuk dengan Google dibatalkan.",
  GOOGLE_LOGIN_UNAVAILABLE: "Masuk dengan Google belum tersedia.",
  GOOGLE_LOGIN_NOT_CONFIGURED: "Masuk dengan Google belum tersedia.",
  GOOGLE_EMAIL_PASSWORD_REQUIRED:
    "Email ini bukan akun Google. Masuk dengan email dan kata sandi.",
  GOOGLE_EMAIL_NOT_VERIFIED: "Email Google ini belum terverifikasi.",
  GOOGLE_CREDENTIAL_INVALID: "Gagal masuk dengan Google. Coba lagi.",
  GOOGLE_ACCOUNT_INACTIVE: "Akun ini sedang nonaktif.",
};

export function failureMessage(status: number, message: string | undefined) {
  if (message && CODE_MESSAGES[message]) return CODE_MESSAGES[message];
  if (status === 401) return CODE_MESSAGES.UNAUTHORIZED;
  if (message && !/^[A-Z_]+$/.test(message)) return message;
  return CODE_MESSAGES.GENERAL_ERROR;
}

/** Staff access tokens are short-lived; the refresh cookie renews them once. */
async function refreshStaffSession(): Promise<boolean> {
  const res = await fetch(`${BASE.admin}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  }).catch(() => null);
  if (!res?.ok) return false;
  const json = (await res.json().catch(() => null)) as {
    data?: { access_token?: string };
  } | null;
  if (!json?.data?.access_token) return false;
  setToken("admin", json.data.access_token);
  return true;
}

/**
 * One request function for both backends. Participants talk to web-be-go,
 * staff to admin-be-go, each with its own session.
 */
export async function request<T>(
  target: ApiTarget,
  method: Method,
  path: string,
  body?: unknown,
  retried = false,
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
    if (
      res.status === 401 &&
      target === "admin" &&
      token &&
      !retried &&
      (await refreshStaffSession())
    )
      return request<T>(target, method, path, body, true);
    if (res.status === 401 && token) setToken(target, null);
    throw new ApiError(res.status, failureMessage(res.status, json?.message));
  }
  return (json?.data ?? json) as T;
}

/**
 * Opens an uploaded file through the authorised /perintis/files endpoint and
 * returns an object URL (the caller revokes it).
 */
export async function fetchFileUrl(
  target: ApiTarget,
  key: string,
): Promise<string> {
  const res = await fetch(
    `${BASE[target]}/perintis/files?key=${encodeURIComponent(key)}`,
    {
      credentials: "include",
      headers: getToken(target)
        ? { Authorization: `Bearer ${getToken(target)}` }
        : {},
    },
  );
  if (!res.ok) throw new ApiError(res.status, "Berkas tidak bisa dibuka.");
  return URL.createObjectURL(await res.blob());
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
