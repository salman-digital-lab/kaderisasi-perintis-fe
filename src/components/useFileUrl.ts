import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { fetchFileUrl, USE_MOCK } from "@/api/client";
import type { ApiTarget } from "@/api/errors";

/** Staff screens read files from admin-be-go, everyone else from web-be-go. */
export function useApiTarget(): ApiTarget {
  return useLocation().pathname.startsWith("/kelola") ? "admin" : "web";
}

/**
 * The URL to show an uploaded image: the mock's data URL, or an object URL
 * fetched with the session from the authorised files endpoint.
 */
export function useFileUrl(
  key: string,
  previewUrl: string | null,
  enabled = true,
): string | null {
  const target = useApiTarget();
  const [url, setUrl] = useState<{ key: string; url: string } | null>(null);
  const shouldFetch = enabled && !previewUrl && !USE_MOCK;
  useEffect(() => {
    if (!shouldFetch) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    fetchFileUrl(target, key)
      .then((u) => {
        objectUrl = u;
        if (cancelled) URL.revokeObjectURL(u);
        else setUrl({ key, url: u });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key, shouldFetch, target]);
  if (previewUrl) return previewUrl;
  return url?.key === key ? url.url : null;
}

/** Opens a non-image upload (PDF) in a new tab. */
export async function openFile(
  target: ApiTarget,
  key: string,
  previewUrl: string | null,
) {
  const url = previewUrl ?? (USE_MOCK ? null : await fetchFileUrl(target, key));
  if (url) window.open(url, "_blank", "noopener");
}
