import { createSeed, DB_VERSION, type MockDb } from "./seed";

const KEY = "perintis.mock.db";

let cache: MockDb | null = null;

/** The mock database lives in memory and is mirrored to localStorage. */
export function db(): MockDb {
  if (!cache) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MockDb;
        if (parsed.version === DB_VERSION) cache = parsed;
      }
    } catch {
      // Corrupt or unavailable storage falls back to fresh seed data.
    }
    if (!cache) cache = createSeed();
  }
  return cache;
}

export function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Quota errors (large photo previews) keep the in-memory copy only.
  }
}

export function resetDb(): void {
  cache = createSeed();
  persist();
}
