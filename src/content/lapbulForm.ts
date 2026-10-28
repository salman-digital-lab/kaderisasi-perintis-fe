import type { Category, JournalAnswers, JournalFile, Pulse } from "@/api/types";
import { asksForGrades } from "@/lib/time";

/** The lapbul form is fixed in code (PRD §8.3); bump on any change. */
export const FORM_VERSION = 1;

export const MAX_SHORT = 300;
export const MAX_LONG = 1500;

export const PULSE_ITEMS: { key: keyof Pulse; label: string }[] = [
  { key: "energy", label: "Energi & kesehatan" },
  { key: "academic", label: "Akademik" },
  { key: "finance", label: "Keuangan" },
  { key: "relation", label: "Relasi & keluarga" },
];

export const SHARING_KINDS = ["Waktu", "Tenaga", "Ilmu", "Harta"];

export const LIVING_COST_USES = [
  "Makan",
  "Transportasi",
  "Kebutuhan kuliah",
  "Tempat tinggal",
  "Membantu keluarga",
  "Lainnya",
];

export const TARGET_RESULTS = [
  { value: "tercapai", label: "Tercapai" },
  { value: "sebagian", label: "Sebagian" },
  { value: "belum", label: "Belum" },
] as const;

export type StepKey =
  | "auto"
  | "kabar"
  | "target"
  | "insight"
  | "ruhiyah"
  | "ukhuwah"
  | "nilai"
  | "ekonomi"
  | "tinjau";

export interface StepDef {
  key: StepKey;
  title: string;
  section: string;
}

export interface FormState {
  answers: JournalAnswers;
  pulse: Pulse;
  wantsContact: boolean;
  files: JournalFile[];
}

export function stepsFor(category: Category, month: string): StepDef[] {
  const steps: StepDef[] = [
    { key: "auto", title: "Data dari sistem", section: "Bagian 0" },
    { key: "kabar", title: "Kabar & pulse", section: "Bagian 1" },
    { key: "target", title: "Target jika–maka", section: "Bagian 2" },
    { key: "insight", title: "Insight & bukti praktik", section: "Bagian 3" },
    { key: "ruhiyah", title: "Ruhiyah", section: "Bagian 5" },
    { key: "ukhuwah", title: "Ukhuwah", section: "Bagian 6" },
  ];
  if (asksForGrades(month))
    steps.push({ key: "nilai", title: "IP & KHS", section: "Bagian 7" });
  if (category === "biaya_hidup")
    steps.push({
      key: "ekonomi",
      title: "Kondisi ekonomi",
      section: "Bagian 8",
    });
  steps.push({ key: "tinjau", title: "Tinjau & kirim", section: "Selesai" });
  return steps;
}

export function estimatedMinutes(category: Category): number {
  return category === "biaya_hidup" ? 10 : 8;
}

const filled = (v: string | undefined) => !!v && v.trim().length > 0;

/** Missing required items per step, following the per-category table (PRD §8.3). */
export function missingFor(
  step: StepKey,
  state: FormState,
  ctx: { category: Category; previousTargets: string[] | null },
): string[] {
  const a = state.answers;
  const missing: string[] = [];
  switch (step) {
    case "kabar":
      if (Object.values(state.pulse).some((v) => v == null))
        missing.push("1a Pulse (4 skala)");
      if (!filled(a.s1b)) missing.push("1b Satu kalimat tentang bulan ini");
      if (!filled(a.s1c)) missing.push("1c Kabar keluarga");
      break;
    case "target":
      if (
        ctx.previousTargets?.length &&
        (a.s2a ?? []).filter(Boolean).length < ctx.previousTargets.length
      )
        missing.push("2a Status target bulan lalu");
      if (!filled(a.s2b)) missing.push("2b Yang membantu atau menghambat");
      if ((a.targets ?? []).filter(filled).length < 3)
        missing.push("2c Tiga target bulan depan");
      break;
    case "insight":
      if (!filled(a.s3a)) missing.push("3a Insight terbesar");
      break;
    case "ruhiyah":
      if (a.s5aPages == null) missing.push("5a Jumlah bacaan");
      if (!filled(a.s5aVerse)) missing.push("5a Ayat/pesan berkesan");
      if (!filled(a.s5b)) missing.push("5b Amalan yang dijaga");
      if (!(a.s5cKinds ?? []).length) missing.push("5c Bentuk berbagi");
      break;
    case "ukhuwah":
      if (!filled(a.s6)) missing.push("6 Teman Perintis");
      break;
    case "nilai":
      if (a.s7ip == null) missing.push("7 IP semester");
      if (!state.files.some((f) => f.field === "s7khs"))
        missing.push("7 Unggah KHS");
      break;
    case "ekonomi":
      if (a.s8aChanged == null) missing.push("8a Perubahan kondisi ekonomi");
      if (a.s8aChanged && !filled(a.s8aText)) missing.push("8a Penjelasan");
      if (!(a.s8b ?? []).length) missing.push("8b Pemakaian bantuan");
      break;
    default:
      break;
  }
  return missing;
}

export function allMissing(
  steps: StepDef[],
  state: FormState,
  ctx: { category: Category; previousTargets: string[] | null },
): { step: StepDef; items: string[] }[] {
  return steps
    .map((step) => ({ step, items: missingFor(step.key, state, ctx) }))
    .filter((s) => s.items.length > 0);
}

/** Wellbeing flag rule (PRD §8.6): two pulse scales ≤ 2, or 1e checked. */
export function flagTrigger(
  pulse: Pulse,
  wantsContact: boolean,
): "low_pulse" | "contact_request" | "both" | null {
  const low =
    Object.values(pulse).filter((v) => v != null && v <= 2).length >= 2;
  if (low && wantsContact) return "both";
  if (low) return "low_pulse";
  if (wantsContact) return "contact_request";
  return null;
}
