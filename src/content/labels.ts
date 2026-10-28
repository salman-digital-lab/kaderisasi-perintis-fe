import type {
  Category,
  FlagStatus,
  FlagTrigger,
  JournalListStatus,
  KaderisasiOverride,
  ParticipantStatus,
  ReportStatus,
  Role,
} from "@/api/types";

export type Tone = "gray" | "blue" | "green" | "orange" | "red" | "violet";

export const ROLE_LABEL: Record<Role, string> = {
  mentee: "Mentee",
  mentor: "Mentor",
  coordinator: "Koordinator",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  dasar: "Beswan dasar",
  biaya_hidup: "Penerima biaya hidup",
};

/** Kategori label; a mentee enrolled before it was known shows a gap. */
export const categoryLabel = (c: string | null | undefined) =>
  (c && CATEGORY_LABEL[c as Category]) || "Kategori belum diisi";

/**
 * A mentee enrolled before NIM, kategori or KIP-K were known. Without a
 * kategori they cannot start a lapbul (the kategori picks the form).
 */
export const menteeDataMissing = (p: {
  nim: string | null;
  category: Category | null;
  kipK: boolean | null;
}) => !p.nim || !p.category || p.kipK == null;

export const PARTICIPANT_STATUS: Record<
  ParticipantStatus,
  { label: string; tone: Tone }
> = {
  active: { label: "Aktif", tone: "green" },
  pending: { label: "Menunggu keputusan", tone: "orange" },
  reserve: { label: "Cadangan", tone: "violet" },
  inactive: { label: "Nonaktif", tone: "gray" },
};

export const JOURNAL_STATUS: Record<
  JournalListStatus,
  { label: string; tone: Tone }
> = {
  not_started: { label: "Belum mengisi", tone: "gray" },
  draft: { label: "Draf", tone: "gray" },
  submitted: { label: "Terkirim", tone: "blue" },
  accepted: { label: "Diterima", tone: "green" },
  revision_requested: { label: "Perlu perbaikan", tone: "orange" },
  revised: { label: "Direvisi", tone: "blue" },
  flagged: { label: "Ditandai ke pengelola", tone: "red" },
};

export const REPORT_STATUS: Record<
  ReportStatus | "not_started",
  { label: string; tone: Tone }
> = {
  not_started: { label: "Belum dibuat", tone: "gray" },
  draft: { label: "Draf", tone: "gray" },
  submitted: { label: "Diajukan", tone: "blue" },
  returned: { label: "Dikembalikan", tone: "orange" },
  verified: { label: "Diverifikasi", tone: "green" },
};

export const FLAG_STATUS: Record<FlagStatus, { label: string; tone: Tone }> = {
  open: { label: "Bendera terbuka", tone: "red" },
  handled: { label: "Sudah dihubungi", tone: "green" },
  escalated: { label: "Tereskalasi", tone: "red" },
  resolved: { label: "Selesai", tone: "gray" },
};

export const FLAG_TRIGGER: Record<FlagTrigger, string> = {
  low_pulse: "Dua skala pulse ≤ 2",
  contact_request: "Ingin dihubungi",
  both: "Pulse rendah & ingin dihubungi",
};

export const OVERRIDE_LABEL: Record<KaderisasiOverride, string> = {
  lmd_lama: "Alumni LMD lama",
  lmd_242: "LMD 242",
  setara: "Jalur setara LMD",
  belum: "Belum",
};

export const TASK_LABEL = {
  t1: "Laporan diverifikasi koordinator",
  t2: "Semua lapbul terkirim sudah ditanggapi",
  t3: "Laporan diajukan ≤ tgl 12",
} as const;

/** Bab 12.3 referral guide, shown on response and follow-up screens. */
export const REFERRAL_GUIDE = [
  "Tanda bahaya (ingin menyakiti diri, kekerasan, krisis kesehatan): hubungi Kapro ≤ 24 jam dan tandai ke pengelola.",
  "Butuh teman bicara: arahkan ke Ruang Curhat Salman atau layanan konseling kampus.",
  "Kebutuhan biaya mendesak: tandai ke pengelola dengan uraian singkat; jangan menjanjikan bantuan.",
  "Masalah akademik: dorong menemui dosen wali; catat di tanggapan.",
];
