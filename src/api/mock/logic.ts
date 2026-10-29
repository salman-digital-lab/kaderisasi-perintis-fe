import { ApiError } from "@/api/errors";
import type {
  FullProfile,
  Journal,
  JournalListItem,
  JournalStatus,
  Markers,
  MentorTasks,
  Participant,
  PersonSummary,
  Profile,
  Role,
  SessionReport,
} from "@/api/types";
import {
  currentReportMonth,
  deadlines,
  journalWindow,
  monthKey,
  monthStart,
  now,
  FIRST_MONTH,
  tingkat,
  tz,
} from "@/lib/time";
import type { StoredReport } from "./seed";
import { db } from "./store";

export const RESPONDED: JournalStatus[] = [
  "accepted",
  "revision_requested",
  "flagged",
];
export const WAITING: JournalStatus[] = ["submitted", "revised"];

export function profile(userId: number): Profile {
  const p = db().profiles.find((x) => x.userId === userId);
  if (!p) throw new ApiError(404, "Pengguna tidak ditemukan.");
  return p;
}

export function participant(userId: number): Participant {
  const p = db().participants.find((x) => x.userId === userId);
  if (!p)
    throw new ApiError(
      403,
      "Akunmu belum terdaftar sebagai peserta pembinaan. Hubungi mentor.",
    );
  return p;
}

export function person(userId: number | null): PersonSummary | null {
  if (userId == null) return null;
  const p = db().profiles.find((x) => x.userId === userId);
  return p ? { userId: p.userId, name: p.name, phone: p.phone } : null;
}

export function rolesOf(p: Participant): Role[] {
  if (p.status === "inactive") return [];
  const roles: Role[] = [];
  if (p.isMentee) roles.push("mentee");
  if (p.isMentor) roles.push("mentor");
  if (p.isCoordinator) roles.push("coordinator");
  return roles;
}

export function requireRole(userId: number, role: Role): Participant {
  const p = participant(userId);
  if (!rolesOf(p).includes(role))
    throw new ApiError(403, "Halaman ini tidak tersedia untuk peranmu.");
  return p;
}

export function menteesOf(mentorId: number): Participant[] {
  return db().participants.filter(
    (p) => p.isMentee && p.mentorUserId === mentorId && p.status === "active",
  );
}

export function mentorsOf(coordinatorId: number): Participant[] {
  return db().participants.filter(
    (p) =>
      p.isMentor &&
      p.coordinatorUserId === coordinatorId &&
      p.status !== "inactive",
  );
}

export function tingkatOf(userId: number): number {
  return tingkat(profile(userId).intakeYear);
}

/** Group tingkat = majority tingkat of the mentor's active mentees (PRD §9.3). */
export function groupTingkat(mentorId: number): number {
  const counts = new Map<number, number>();
  for (const m of menteesOf(mentorId)) {
    const t = tingkatOf(m.userId);
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best = 1;
  let bestCount = 0;
  for (const [t, c] of counts)
    if (c > bestCount || (c === bestCount && t < best)) {
      best = t;
      bestCount = c;
    }
  return best;
}

export function findJournal(menteeId: number, month: string): Journal | null {
  return (
    db().journals.find(
      (j) => j.menteeUserId === menteeId && j.month === month,
    ) ?? null
  );
}

export function journalById(id: number): Journal {
  const j = db().journals.find((x) => x.id === id);
  if (!j) throw new ApiError(404, "Catatan Perjalanan tidak ditemukan.");
  return j;
}

export function findReport(
  mentorId: number,
  month: string,
): StoredReport | null {
  return (
    db().reports.find(
      (r) => r.mentorUserId === mentorId && r.month === month,
    ) ?? null
  );
}

/** Flags not handled within 3 days become escalated (run before each request). */
export function escalateFlags(): boolean {
  let changed = false;
  for (const j of db().journals) {
    if (j.flag?.status === "open" && now().isAfter(tz(j.flag.dueAt))) {
      j.flag.status = "escalated";
      changed = true;
    }
  }
  return changed;
}

export function journalMonthJournals(
  mentorId: number,
  month: string,
): Journal[] {
  return db().journals.filter(
    (j) => j.mentorUserId === mentorId && j.month === month,
  );
}

export function unresponded(mentorId: number, month: string): number {
  return journalMonthJournals(mentorId, month).filter((j) =>
    WAITING.includes(j.status),
  ).length;
}

/** T1–T3 are computed, never stored (PRD §9.4). */
export function mentorTasks(mentorId: number, month: string): MentorTasks {
  const report = findReport(mentorId, month);
  const due = deadlines(month);
  const submitted = journalMonthJournals(mentorId, month).filter(
    (j) => j.status !== "draft",
  );
  return {
    t1: report?.status === "verified",
    t2: submitted.every(
      (j) =>
        RESPONDED.includes(j.status) &&
        !!j.response &&
        !tz(j.response.respondedAt).isAfter(due.mentorDue),
    ),
    t3: !!report?.submittedAt && !tz(report.submittedAt).isAfter(due.reportDue),
  };
}

export function toReport(r: StoredReport, hideCase: boolean): SessionReport {
  const { followup: _followup, ...rest } = r;
  void _followup;
  return {
    ...rest,
    caseNote: hideCase ? null : r.caseNote,
    hasCase: !!r.caseNote,
  };
}

export function listItem(menteeId: number, month: string): JournalListItem {
  const j = findJournal(menteeId, month);
  return {
    journalId: j?.id ?? null,
    month,
    status: j?.status ?? "not_started",
    isLate: j?.isLate ?? false,
    submittedAt: j?.submittedAt ?? null,
    responseUnread: !!j?.response && !j.response.readAt,
    window: j?.reopenReason ? "open" : journalWindow(month),
  };
}

/** Two report months in a row without a submitted lapbul (Bab 9 no. 17). */
export function inactiveStreak(menteeId: number, month: string): boolean {
  const prev = monthKey(monthStart(month).subtract(1, "month"));
  if (prev < FIRST_MONTH) return false;
  const submitted = (m: string) => {
    const j = findJournal(menteeId, m);
    return !!j && j.status !== "draft";
  };
  return !submitted(month) && !submitted(prev);
}

export function markers(userId: number): Markers {
  const p = participant(userId);
  const month = currentReportMonth();
  const result: Markers = {
    lapbulPending: false,
    responseUnread: false,
    journalsToRespond: 0,
    openFlags: 0,
    reportPending: false,
    reportReviewUnread: false,
    reportsToVerify: 0,
  };
  if (!month) return result;
  if (p.isMentee) {
    const j = findJournal(userId, month);
    const window = journalWindow(month);
    // Without kategori the lapbul cannot be started yet.
    const canStart = !!j || !!p.category;
    result.lapbulPending =
      (canStart &&
        window !== "upcoming" &&
        window !== "locked" &&
        (!j || j.status === "draft")) ||
      j?.status === "revision_requested";
    result.responseUnread = db().journals.some(
      (x) => x.menteeUserId === userId && !!x.response && !x.response.readAt,
    );
  }
  if (p.isMentor) {
    const journals = journalMonthJournals(userId, month);
    result.journalsToRespond = journals.filter((j) =>
      WAITING.includes(j.status),
    ).length;
    result.openFlags = journals.filter(
      (j) => j.flag?.status === "open" || j.flag?.status === "escalated",
    ).length;
    const r = findReport(userId, month);
    result.reportPending =
      menteesOf(userId).length > 0 &&
      (!r || r.status === "draft" || r.status === "returned");
    result.reportReviewUnread = db().reports.some(
      (x) => x.mentorUserId === userId && !!x.review && !x.review.readAt,
    );
  }
  if (p.isCoordinator) {
    const mentorIds = mentorsOf(userId).map((m) => m.userId);
    result.reportsToVerify = db().reports.filter(
      (r) =>
        r.month === month &&
        mentorIds.includes(r.mentorUserId) &&
        r.status === "submitted",
    ).length;
  }
  return result;
}

export function fullProfile(
  userId: number,
  opts: { sensitiveHidden: boolean },
): FullProfile {
  const p = participant(userId);
  const prof = profile(userId);
  const mentor = p.mentorUserId ? participant(p.mentorUserId) : null;
  const month = currentReportMonth();
  const j = month ? findJournal(userId, month) : null;
  const lastResponded = db()
    .journals.filter((x) => x.menteeUserId === userId && x.response)
    .sort((a, b) => b.month.localeCompare(a.month))[0];
  const report =
    month && p.mentorUserId ? findReport(p.mentorUserId, month) : null;
  const participantView = opts.sensitiveHidden
    ? { ...p, kipK: null, category: null }
    : p;
  return {
    profile: prof,
    participant: participantView,
    tingkat: tingkatOf(userId),
    mentor: person(p.mentorUserId),
    coordinator: person(mentor?.coordinatorUserId ?? null),
    activities: db().activities[userId] ?? [],
    clubs: db().clubs[userId] ?? [],
    achievements: db().achievements[userId] ?? [],
    sensitiveHidden: opts.sensitiveHidden,
    summary: {
      month,
      journalStatus: p.isMentee ? (j?.status ?? "not_started") : null,
      lastResponse: lastResponded?.response?.text ?? null,
      sessionDate: report?.sessionDate ?? null,
    },
  };
}

export function requireText(value: unknown, label: string, max = 1500): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ApiError(422, `${label} wajib diisi.`);
  if (text.length > max)
    throw new ApiError(422, `${label} maksimal ${max} karakter.`);
  return text;
}

export function nextFileKey(prefix: string, name: string): string {
  db().seq.file += 1;
  return `mock/${prefix}/${db().seq.file}-${name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
}
