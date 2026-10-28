import { useEffect, useRef } from "react";
import { failureMessage } from "@/api/client";
import { ApiError } from "@/api/errors";

/** Google OAuth client shared with the Kaderisasi web and admin apps. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

const FLOW_KEY = "perintis.google.flow";
const MAX_AGE_MS = 10 * 60 * 1000;

/** The callback registered for this app (also allow-listed by web-be-go). */
export function googleRedirectUri(): string {
  return `${window.location.origin}/masuk/google`;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64url(bytes);
}

function base64url(bytes: Uint8Array): string {
  let text = "";
  for (const b of bytes) text += String.fromCharCode(b);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

interface Flow {
  state: string;
  codeVerifier: string;
  nonce: string;
  createdAt: number;
}

/**
 * Participants: authorization-code flow with PKCE, the same one
 * kaderisasi-web-fe uses, with the verifier kept in this tab only.
 */
export async function startParticipantGoogle(): Promise<void> {
  const flow: Flow = {
    state: randomToken(),
    codeVerifier: randomToken(),
    nonce: randomToken(),
    createdAt: Date.now(),
  };
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(flow.codeVerifier),
  );
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: base64url(new Uint8Array(digest)),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  window.location.assign(url.toString());
}

/** Reads and clears the pending flow, checking the state Google echoed back. */
export function takeParticipantGoogle(search: URLSearchParams): {
  code: string;
  codeVerifier: string;
  nonce: string;
} {
  const raw = sessionStorage.getItem(FLOW_KEY);
  sessionStorage.removeItem(FLOW_KEY);
  let flow: Flow | null = null;
  try {
    flow = raw ? (JSON.parse(raw) as Flow) : null;
  } catch {
    flow = null;
  }
  const age = flow ? Date.now() - flow.createdAt : Infinity;
  if (
    !flow ||
    search.get("state") !== flow.state ||
    age < 0 ||
    age > MAX_AGE_MS
  )
    throw new ApiError(400, failureMessage(400, "GOOGLE_LOGIN_EXPIRED"));
  if (search.has("error"))
    throw new ApiError(400, failureMessage(400, "GOOGLE_LOGIN_CANCELLED"));
  const code = search.get("code");
  if (!code)
    throw new ApiError(400, failureMessage(400, "GOOGLE_LOGIN_FAILED"));
  return { code, codeVerifier: flow.codeVerifier, nonce: flow.nonce };
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: Record<string, string | number>,
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

/**
 * Staff: the Google Identity Services button, as in kaderisasi-admin-fe. The
 * credential (ID token) goes to admin-be-go's /auth/google.
 */
export function useGoogleButton(onCredential: (credential: string) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  useEffect(() => {
    callback.current = onCredential;
  });
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !ref.current) return;
    const render = () => {
      if (!window.google || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }) => callback.current(credential),
      });
      window.google.accounts.id.renderButton(ref.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        width: Math.min(360, ref.current.clientWidth),
      });
    };
    if (window.google) {
      render();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, []);
  return ref;
}
