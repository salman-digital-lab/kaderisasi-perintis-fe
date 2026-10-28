import type { FilePayload } from "@/api/endpoints";

const MAX_SIDE = 1600;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Photos are compressed in the browser before upload (PRD §8.4 no. 5). */
async function compressImage(
  file: File,
): Promise<{ dataUrl: string; size: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return { dataUrl, size: Math.round((dataUrl.length * 3) / 4) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function toPayload(file: File): Promise<FilePayload> {
  if (file.type.startsWith("image/") && file.type !== "image/gif") {
    try {
      const { dataUrl, size } = await compressImage(file);
      return {
        name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
        mime: "image/jpeg",
        size,
        dataUrl,
      };
    } catch {
      // Unreadable images are sent as-is and validated by the server.
    }
  }
  return {
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
    // The mock keeps previews only for small files to fit in localStorage.
    dataUrl: file.size < 300_000 ? await readAsDataUrl(file) : null,
  };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
