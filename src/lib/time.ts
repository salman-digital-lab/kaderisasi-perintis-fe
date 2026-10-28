import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/id";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

export const TZ = "Asia/Jakarta";

/** First reporting month of the program (opens 1 Dec 2026). */
export const FIRST_MONTH = "2026-11-01";

const CLOCK_KEY = "perintis.mock.now";

/** Simulated "now" presets so deadlines can be tried without waiting. */
export const CLOCK_PRESETS = [
  {
    value: "2027-01-04T10:00:00+07:00",
    label: "Sen, 4 Jan 2027 · masa pengisian",
  },
  {
    value: "2027-01-08T10:00:00+07:00",
    label: "Jum, 8 Jan 2027 · kiriman terlambat",
  },
  {
    value: "2027-01-13T10:00:00+07:00",
    label: "Rab, 13 Jan 2027 · lapbul terkunci",
  },
  {
    value: "2027-01-16T10:00:00+07:00",
    label: "Sab, 16 Jan 2027 · lewat tenggat verifikasi",
  },
] as const;

export function getClock(): string {
  try {
    return localStorage.getItem(CLOCK_KEY) ?? CLOCK_PRESETS[0].value;
  } catch {
    return CLOCK_PRESETS[0].value;
  }
}

export function setClock(value: string): void {
  try {
    localStorage.setItem(CLOCK_KEY, value);
  } catch {
    // Storage can be unavailable (private mode); the default clock is used.
  }
}

/** Current time in Asia/Jakarta (simulated while the mock API is on). */
export function now(): Dayjs {
  return dayjs(getClock()).tz(TZ);
}

export function nowIso(): string {
  return now().toISOString();
}

export function tz(value: string | Date): Dayjs {
  return dayjs(value).tz(TZ);
}

/** Parses a `YYYY-MM-DD` month key as midnight in Jakarta. */
export function monthStart(month: string): Dayjs {
  return dayjs.tz(month, TZ).startOf("month");
}

export function monthKey(d: Dayjs): string {
  return d.startOf("month").format("YYYY-MM-DD");
}

/** The month whose lapbul is currently open (last month), or null before the program. */
export function currentReportMonth(): string | null {
  const month = monthKey(now().subtract(1, "month"));
  return month < FIRST_MONTH ? null : month;
}

export function reportMonths(): string[] {
  const latest = currentReportMonth();
  if (!latest) return [];
  const months: string[] = [];
  let m = monthStart(latest);
  while (monthKey(m) >= FIRST_MONTH) {
    months.push(monthKey(m));
    m = m.subtract(1, "month");
  }
  return months;
}

/** Fixed monthly dates (PRD §5.1), all 23.59 WIB, in the month after the report month. */
export function deadlines(month: string) {
  const next = monthStart(month).add(1, "month");
  return {
    opensAt: next.startOf("day"),
    menteeDue: next.date(5).endOf("day"),
    lockAt: next.date(12).endOf("day"),
    mentorDue: next.date(12).endOf("day"),
    reportDue: next.date(12).endOf("day"),
    responseEditableUntil: next.date(15).endOf("day"),
    verifyDue: next.date(15).endOf("day"),
    unverifyUntil: next.date(20).endOf("day"),
  };
}

export type JournalWindow = "upcoming" | "open" | "late" | "locked";

export function journalWindow(month: string, at: Dayjs = now()): JournalWindow {
  const d = deadlines(month);
  if (at.isBefore(d.opensAt)) return "upcoming";
  if (!at.isAfter(d.menteeDue)) return "open";
  if (!at.isAfter(d.lockAt)) return "late";
  return "locked";
}

/** Months that ask for IP & KHS (section 7). */
export function asksForGrades(month: string): boolean {
  const m = monthStart(month).month();
  return m === 0 || m === 6;
}

export function monthLabel(month: string): string {
  return monthStart(month).format("MMMM YYYY");
}

export function monthShort(month: string): string {
  return monthStart(month).format("MMM YYYY");
}

export function fmtDate(value: string | Dayjs, format = "D MMM YYYY"): string {
  return (typeof value === "string" ? tz(value) : value).format(format);
}

export function fmtDateTime(value: string | Dayjs): string {
  return fmtDate(value, "D MMM YYYY, HH.mm");
}

/** "3 hari lagi", "besok", "hari ini", "lewat 2 hari". */
export function relativeDays(target: string | Dayjs): string {
  const t = typeof target === "string" ? tz(target) : target;
  const days = t.startOf("day").diff(now().startOf("day"), "day");
  if (days === 0) return "hari ini";
  if (days === 1) return "besok";
  if (days > 1) return `${days} hari lagi`;
  return `lewat ${-days} hari`;
}

/** "23 jam lagi" style countdown for short windows such as wellbeing flags. */
export function hoursLeft(target: string): string {
  const hours = tz(target).diff(now(), "hour");
  if (hours < 0) return `lewat ${Math.ceil(-hours / 24)} hari`;
  if (hours < 24) return `${hours} jam lagi`;
  return `${Math.floor(hours / 24)} hari lagi`;
}

export function ageLabel(since: string): string {
  const days = now().diff(tz(since), "day");
  if (days <= 0) return "hari ini";
  return `${days} hari`;
}

/** Tingkat 1–4 from intake year; the academic year starts in August. */
export function tingkat(intakeYear: number, at: Dayjs = now()): number {
  const academicStart = at.month() >= 7 ? at.year() : at.year() - 1;
  return Math.min(4, Math.max(1, academicStart - intakeYear + 1));
}
