import type { ApiTarget } from "@/api/errors";
import { escalateFlags } from "./logic";
import "./participantRoutes";
import { dispatch } from "./router";
import "./staffRoutes";
import { persist } from "./store";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mock backend: same paths as web-be-go / admin-be-go, data in localStorage. */
export async function mockRequest<T>(
  target: ApiTarget,
  method: string,
  url: string,
  body: unknown,
  token: string | null,
): Promise<T> {
  await sleep(180 + Math.random() * 220);
  const escalated = escalateFlags();
  const { result, mutated } = dispatch(
    target,
    method,
    url,
    body === undefined ? {} : structuredClone(body),
    token,
  );
  if (mutated || escalated) persist();
  return structuredClone(result) as T;
}

export { resetDb } from "./store";
