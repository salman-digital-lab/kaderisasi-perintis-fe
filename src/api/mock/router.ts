import { ApiError, type ApiTarget } from "@/api/errors";

export interface Ctx<B = unknown> {
  params: Record<string, string>;
  query: URLSearchParams;
  body: B;
  /** Participant user id (web) or staff id (admin). */
  userId: number;
}

type Handler = (ctx: Ctx) => unknown;

interface RouteDef {
  target: ApiTarget;
  method: string;
  regex: RegExp;
  keys: string[];
  handler: Handler;
  isPublic: boolean;
}

const routes: RouteDef[] = [];

export function route<B = unknown>(
  target: ApiTarget,
  method: "GET" | "POST" | "PUT" | "DELETE",
  pattern: string,
  handler: (ctx: Ctx<B>) => unknown,
  opts: { isPublic?: boolean } = {},
): void {
  const keys: string[] = [];
  const source = pattern.replace(/:([a-zA-Z]+)/g, (_, key: string) => {
    keys.push(key);
    return "([^/]+)";
  });
  routes.push({
    target,
    method,
    regex: new RegExp(`^${source}$`),
    keys,
    handler: handler as Handler,
    isPublic: opts.isPublic ?? false,
  });
}

export function mockToken(target: ApiTarget, id: number): string {
  return `mock.${target}.${id}`;
}

function parseToken(target: ApiTarget, token: string | null): number | null {
  const parts = token?.split(".") ?? [];
  if (parts.length !== 3 || parts[0] !== "mock" || parts[1] !== target)
    return null;
  const id = Number(parts[2]);
  return Number.isFinite(id) ? id : null;
}

export function dispatch(
  target: ApiTarget,
  method: string,
  url: string,
  body: unknown,
  token: string | null,
): { result: unknown; mutated: boolean } {
  const [path, qs = ""] = url.split("?");
  for (const r of routes) {
    if (r.target !== target || r.method !== method) continue;
    const match = r.regex.exec(path);
    if (!match) continue;
    const userId = parseToken(target, token);
    if (!r.isPublic && userId == null)
      throw new ApiError(401, "Sesi berakhir. Silakan masuk lagi.");
    const params = Object.fromEntries(
      r.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]),
    );
    const result = r.handler({
      params,
      query: new URLSearchParams(qs),
      body,
      userId: userId ?? 0,
    });
    return { result, mutated: method !== "GET" };
  }
  throw new ApiError(404, `Endpoint mock belum ada: ${method} ${path}`);
}
