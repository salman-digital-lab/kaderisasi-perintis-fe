import { ApiError } from "@/api/errors";
import type {
  AutoData,
  CoordinatorOverview,
  DashboardRow,
  HistoryItem,
  Journal,
  JournalDetail,
  JournalFile,
  JournalForMentor,
  Me,
  MentorDashboard,
  ReportDetail,
  ReportListItem,
  RespondInput,
  ReviewInput,
  SaveJournalInput,
  SaveReportInput,
  UploadedFile,
} from "@/api/types";
import { curriculumFor } from "@/content/curriculum";
import {
  allMissing,
  flagTrigger,
  FORM_VERSION,
  stepsFor,
} from "@/content/lapbulForm";
import {
  currentReportMonth,
  deadlines,
  journalWindow,
  monthKey,
  monthStart,
  now,
  nowIso,
  reportMonths,
  tz,
} from "@/lib/time";
import {
  escalateFlags,
  findJournal,
  findReport,
  fullProfile,
  groupTingkat,
  inactiveStreak,
  journalById,
  journalMonthJournals,
  listItem,
  markers,
  menteesOf,
  mentorsOf,
  mentorTasks,
  nextFileKey,
  participant,
  person,
  profile,
  RESPONDED,
  requireRole,
  requireText,
  rolesOf,
  tingkatOf,
  toReport,
  unresponded,
  WAITING,
} from "./logic";
import { mockToken, route } from "./router";
import { db } from "./store";

const MAX_FILE = 5 * 1024 * 1024;

// ---- auth ----

function loginByEmail(email: unknown) {
  const value = typeof email === "string" ? email.trim().toLowerCase() : "";
  const prof = db().profiles.find((p) => p.email === value);
  if (!prof) throw new ApiError(401, "Email atau kata sandi salah.");
  const p = participant(prof.userId);
  if (!rolesOf(p).length)
    throw new ApiError(403, "Akunmu sedang nonaktif di program pembinaan.");
  return { token: mockToken("web", prof.userId), userId: prof.userId };
}

route<{ email: string; password: string }>(
  "web",
  "POST",
  "/auth/login",
  ({ body }) => {
    if (!body.password) throw new ApiError(422, "Kata sandi wajib diisi.");
    return loginByEmail(body.email);
  },
  { isPublic: true },
);

route<{ email: string }>(
  "web",
  "POST",
  "/auth/google",
  ({ body }) => loginByEmail(body.email),
  { isPublic: true },
);

route("web", "GET", "/perintis/me", ({ userId }): Me => {
  escalateFlags();
  const p = participant(userId);
  const mentor = p.mentorUserId ? participant(p.mentorUserId) : null;
  return {
    profile: profile(userId),
    participant: p,
    roles: rolesOf(p),
    mentor: person(p.mentorUserId),
    coordinator: person(mentor?.coordinatorUserId ?? null),
    markers: markers(userId),
  };
});

route("web", "GET", "/perintis/me/profile", ({ userId }) =>
  fullProfile(userId, { sensitiveHidden: false }),
);

route(
  "web",
  "GET",
  "/perintis/mentees/:menteeId/profile",
  ({ userId, params }) => {
    const mentee = participant(Number(params.menteeId));
    const me = participant(userId);
    const isMentor = me.isMentor && mentee.mentorUserId === userId;
    const mentorRow = mentee.mentorUserId
      ? participant(mentee.mentorUserId)
      : null;
    const isCoordinator =
      me.isCoordinator && mentorRow?.coordinatorUserId === userId;
    if (!isMentor && !isCoordinator)
      throw new ApiError(403, "Mentee ini bukan bagian dari kelompokmu.");
    return fullProfile(mentee.userId, { sensitiveHidden: !isMentor });
  },
);

// ---- mentee: lapbul ----

route("web", "GET", "/perintis/me/journals", ({ userId }) => {
  requireRole(userId, "mentee");
  escalateFlags();
  return reportMonths().map((m) => listItem(userId, m));
});

function autoData(
  userId: number,
  month: string,
  journal: Journal | null,
): AutoData {
  const p = participant(userId);
  const prof = profile(userId);
  const mentorId = journal?.mentorUserId ?? p.mentorUserId;
  const mentor = mentorId ? participant(mentorId) : null;
  const report = mentorId ? findReport(mentorId, month) : null;
  const start = monthStart(month);
  return {
    name: prof.name,
    nim: p.nim,
    university: prof.university,
    major: prof.major,
    intakeYear: prof.intakeYear,
    tingkat: tingkatOf(userId),
    category: journal?.category ?? p.category ?? "dasar",
    mentorName: person(mentorId)?.name ?? null,
    coordinatorName: person(mentor?.coordinatorUserId ?? null)?.name ?? null,
    session: report?.sessionDate
      ? {
          date: report.sessionDate,
          theme: curriculumFor(groupTingkat(mentorId!), month).theme,
        }
      : null,
    activities: (db().activities[userId] ?? [])
      .filter((a) => {
        const d = tz(a.date);
        return !d.isBefore(start) && d.isBefore(start.add(1, "month"));
      })
      .map((a) => `${a.name} (${a.status})`),
    sscStatus: prof.sscStatus,
    lmdStatus: prof.lmdStatus,
    clubs: (db().clubs[userId] ?? []).map((c) => `${c.name} · ${c.role}`),
  };
}

function previousTargets(userId: number, month: string): string[] | null {
  const prev = monthKey(monthStart(month).subtract(1, "month"));
  const j = findJournal(userId, prev);
  const targets = j && j.status !== "draft" ? j.answers.targets : undefined;
  return targets?.filter((t) => t.trim()).length ? targets : null;
}

function revisionDueAt(j: Journal | null): string | null {
  if (j?.status !== "revision_requested" || !j.response) return null;
  return tz(j.response.respondedAt).add(7, "day").toISOString();
}

function editability(j: Journal | null, month: string) {
  const window = journalWindow(month);
  if (j?.status === "revision_requested") {
    const due = revisionDueAt(j)!;
    return now().isAfter(tz(due))
      ? { canEdit: false, lockedReason: "Batas perbaikan 7 hari sudah lewat." }
      : { canEdit: true, lockedReason: null };
  }
  if (j && j.status !== "draft")
    return {
      canEdit: false,
      lockedReason:
        "Sudah terkirim. Isian hanya bisa dibaca kecuali mentor meminta perbaikan.",
    };
  if (j?.reopenReason) return { canEdit: true, lockedReason: null };
  if (window === "upcoming")
    return {
      canEdit: false,
      lockedReason: "Belum dibuka. Lapbul dibuka tanggal 1.",
    };
  if (window === "locked")
    return {
      canEdit: false,
      lockedReason:
        "Terkunci sejak tanggal 12. Hubungi pengelola bila perlu dibuka kembali.",
    };
  return { canEdit: true, lockedReason: null };
}

function journalDetail(userId: number, month: string): JournalDetail {
  const p = participant(userId);
  const j = findJournal(userId, month);
  return {
    month,
    category: j?.category ?? p.category ?? "dasar",
    window: j?.reopenReason ? "open" : journalWindow(month),
    journal: j,
    autoData: autoData(userId, month, j),
    previousTargets: previousTargets(userId, month),
    revisionDueAt: revisionDueAt(j),
    ...editability(j, month),
  };
}

function requireMonth(month: string): string {
  if (!reportMonths().includes(month))
    throw new ApiError(404, "Bulan laporan tidak tersedia.");
  return month;
}

route("web", "GET", "/perintis/me/journals/:month", ({ userId, params }) => {
  requireRole(userId, "mentee");
  return journalDetail(userId, requireMonth(params.month));
});

function ensureJournal(userId: number, month: string): Journal {
  const existing = findJournal(userId, month);
  if (existing) return existing;
  const p = participant(userId);
  db().seq.journal += 1;
  const j: Journal = {
    id: db().seq.journal,
    menteeUserId: userId,
    month,
    mentorUserId: p.mentorUserId,
    category: p.category ?? "dasar",
    formVersion: FORM_VERSION,
    status: "draft",
    answers: {},
    files: [],
    pulse: { energy: null, academic: null, finance: null, relation: null },
    wantsContact: false,
    honestyConfirmedAt: null,
    submittedAt: null,
    isLate: false,
    revision: 0,
    reopenReason: null,
    response: null,
    flag: null,
    followup: null,
    updatedAt: nowIso(),
  };
  db().journals.push(j);
  return j;
}

function editableJournal(userId: number, month: string): Journal {
  requireRole(userId, "mentee");
  requireMonth(month);
  const { canEdit, lockedReason } = editability(
    findJournal(userId, month),
    month,
  );
  if (!canEdit)
    throw new ApiError(409, lockedReason ?? "Lapbul tidak bisa diubah.");
  return ensureJournal(userId, month);
}

route<SaveJournalInput>(
  "web",
  "PUT",
  "/perintis/me/journals/:month",
  ({ userId, params, body }) => {
    const j = editableJournal(userId, params.month);
    if (body.revision !== j.revision)
      throw new ApiError(
        409,
        "Draf ini sudah diubah dari perangkat lain. Muat ulang untuk melihat versi terbaru.",
      );
    const trimmed = Object.fromEntries(
      Object.entries(body.answers).map(([k, v]) => [
        k,
        typeof v === "string"
          ? v.trim()
          : Array.isArray(v)
            ? v.map((x) => (typeof x === "string" ? x.trim() : x))
            : v,
      ]),
    );
    j.answers = trimmed;
    j.pulse = body.pulse;
    j.wantsContact = body.wantsContact;
    if (body.honestyConfirmed && !j.honestyConfirmedAt)
      j.honestyConfirmedAt = nowIso();
    j.revision += 1;
    j.updatedAt = nowIso();
    return journalDetail(userId, params.month);
  },
);

route<{ name: string; mime: string; size: number; dataUrl: string | null }>(
  "web",
  "POST",
  "/perintis/me/journals/:month/files/:field",
  ({ userId, params, body }) => {
    if (params.field !== "s3b" && params.field !== "s7khs")
      throw new ApiError(422, "Isian unggahan tidak dikenal.");
    if (body.size > MAX_FILE)
      throw new ApiError(413, "Ukuran berkas maksimal 5 MB.");
    if (!/^image\/|^application\/pdf$/.test(body.mime))
      throw new ApiError(422, "Hanya foto atau PDF.");
    const j = editableJournal(userId, params.month);
    const file: JournalFile = {
      field: params.field,
      key: nextFileKey(`journals/${j.id}`, body.name),
      name: body.name,
      mime: body.mime,
      size: body.size,
      previewUrl: body.dataUrl,
    };
    j.files.push(file);
    j.revision += 1;
    j.updatedAt = nowIso();
    return journalDetail(userId, params.month);
  },
);

route(
  "web",
  "DELETE",
  "/perintis/me/journals/:month/files/:key",
  ({ userId, params }) => {
    const j = editableJournal(userId, params.month);
    j.files = j.files.filter((f) => f.key !== params.key);
    j.revision += 1;
    return journalDetail(userId, params.month);
  },
);

route(
  "web",
  "POST",
  "/perintis/me/journals/:month/submit",
  ({ userId, params }) => {
    const j = editableJournal(userId, params.month);
    if (!j.honestyConfirmedAt)
      throw new ApiError(422, "Centang pernyataan kejujuran terlebih dulu.");
    const missing = allMissing(
      stepsFor(j.category, j.month),
      {
        answers: j.answers,
        pulse: j.pulse,
        wantsContact: j.wantsContact,
        files: j.files,
      },
      {
        category: j.category,
        previousTargets: previousTargets(userId, j.month),
      },
    );
    if (missing.length)
      throw new ApiError(
        422,
        `Masih ada isian wajib: ${missing.flatMap((m) => m.items).join(", ")}.`,
      );
    if (j.status === "revision_requested") {
      j.status = "revised";
    } else {
      j.status = "submitted";
      j.submittedAt = nowIso();
      j.isLate = !j.reopenReason && journalWindow(j.month) === "late";
      const trigger = flagTrigger(j.pulse, j.wantsContact);
      if (trigger)
        j.flag = {
          trigger,
          status: "open",
          dueAt: now().add(3, "day").toISOString(),
          handledBy: null,
          handledAt: null,
          privateNote: null,
        };
    }
    j.revision += 1;
    j.updatedAt = nowIso();
    return journalDetail(userId, params.month);
  },
);

route(
  "web",
  "POST",
  "/perintis/me/journals/:month/response/read",
  ({ userId, params }) => {
    const j = findJournal(userId, params.month);
    if (j?.response && !j.response.readAt) j.response.readAt = nowIso();
    return { ok: true };
  },
);

// ---- mentor ----

route(
  "web",
  "GET",
  "/perintis/mentor/dashboard",
  ({ userId, query }): MentorDashboard => {
    requireRole(userId, "mentor");
    escalateFlags();
    const month = query.get("month") ?? currentReportMonth();
    if (!month) throw new ApiError(404, "Belum ada bulan laporan.");
    const rows: DashboardRow[] = menteesOf(userId).map((m) => {
      const j = findJournal(m.userId, month);
      const flagActive = j?.flag && j.flag.status !== "resolved";
      return {
        mentee: {
          ...person(m.userId)!,
          category: m.category ?? "dasar",
          tingkat: tingkatOf(m.userId),
        },
        journalId: j?.id ?? null,
        status: j?.status ?? "not_started",
        isLate: j?.isLate ?? false,
        submittedAt: j?.submittedAt ?? null,
        flag: flagActive && j?.flag ? { ...j.flag, journalId: j.id } : null,
        inactiveStreak: inactiveStreak(m.userId, month),
      };
    });
    // Journals of mentees that moved away mid-month still belong to this mentor.
    const rank = (r: DashboardRow) =>
      r.flag && (r.flag.status === "open" || r.flag.status === "escalated")
        ? 0
        : WAITING.includes(r.status as never)
          ? 1
          : r.status === "not_started" || r.status === "draft"
            ? 2
            : 3;
    rows.sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (a.submittedAt ?? "").localeCompare(b.submittedAt ?? "") ||
        a.mentee.name.localeCompare(b.mentee.name),
    );
    return {
      month,
      tingkat: groupTingkat(userId),
      rows,
      toRespond: unresponded(userId, month),
    };
  },
);

function history(menteeId: number, before: string): HistoryItem[] {
  return db()
    .journals.filter(
      (j) =>
        j.menteeUserId === menteeId && j.month < before && j.status !== "draft",
    )
    .sort((a, b) => b.month.localeCompare(a.month))
    .map((j) => ({
      month: j.month,
      status: j.status,
      pulse: j.pulse,
      appreciation: j.response?.appreciation ?? null,
      responseText: j.response?.text ?? null,
    }));
}

export function journalForReader(
  j: Journal,
  canRespond: boolean,
  reason: string | null,
): JournalForMentor {
  const p = participant(j.menteeUserId);
  const prof = profile(j.menteeUserId);
  return {
    journal: j,
    mentee: {
      ...person(j.menteeUserId)!,
      category: j.category,
      tingkat: tingkatOf(j.menteeUserId),
      university: prof.university,
      major: prof.major,
      kipK: p.kipK,
    },
    previousTargets: previousTargets(j.menteeUserId, j.month),
    history: history(j.menteeUserId, j.month),
    canRespond,
    respondLockedReason: reason,
  };
}

function mentorJournal(userId: number, id: number): Journal {
  requireRole(userId, "mentor");
  const j = journalById(id);
  if (j.mentorUserId !== userId)
    throw new ApiError(403, "Lapbul ini bukan milik mentee di kelompokmu.");
  if (j.status === "draft")
    throw new ApiError(404, "Lapbul belum dikirim mentee.");
  return j;
}

function respondLock(j: Journal): string | null {
  if (now().isAfter(deadlines(j.month).responseEditableUntil))
    return "Tanggapan hanya bisa disunting sampai tanggal 15.";
  return null;
}

route("web", "GET", "/perintis/journals/:id", ({ userId, params }) => {
  escalateFlags();
  const j = mentorJournal(userId, Number(params.id));
  const lock = respondLock(j);
  return journalForReader(j, !lock, lock);
});

route<RespondInput>(
  "web",
  "PUT",
  "/perintis/journals/:id/response",
  ({ userId, params, body }) => {
    const j = mentorJournal(userId, Number(params.id));
    const lock = respondLock(j);
    if (lock) throw new ApiError(409, lock);
    const appreciation = requireText(body.appreciation, "Apresiasi");
    const text = requireText(body.text, "Tanggapan");
    if (!["accepted", "revision_requested", "flagged"].includes(body.decision))
      throw new ApiError(422, "Pilih keputusan.");
    const revisionRequest =
      body.decision === "revision_requested"
        ? requireText(body.revisionRequest, "Permintaan perbaikan")
        : null;
    const flagReason =
      body.decision === "flagged"
        ? requireText(body.flagReason, "Alasan ditandai")
        : null;
    j.response = {
      appreciation,
      text,
      revisionRequest,
      flagReason,
      respondedBy: profile(userId).name,
      respondedAt: nowIso(),
      readAt: null,
    };
    j.status = body.decision;
    if (body.decision === "flagged") j.followup = null;
    j.updatedAt = nowIso();
    return journalForReader(j, true, null);
  },
);

route<{ note: string }>(
  "web",
  "PUT",
  "/perintis/journals/:id/flag",
  ({ userId, params, body }) => {
    const j = mentorJournal(userId, Number(params.id));
    if (!j.flag || j.flag.status === "resolved" || j.flag.status === "handled")
      throw new ApiError(409, "Tidak ada bendera yang perlu ditangani.");
    const note = requireText(body.note, "Catatan privat", 500);
    j.flag.handledBy = profile(userId).name;
    j.flag.handledAt = nowIso();
    j.flag.privateNote = note;
    // Escalated flags stay open for the pengelola to close.
    if (j.flag.status === "open") j.flag.status = "handled";
    return journalForReader(j, !respondLock(j), respondLock(j));
  },
);

// ---- laporan mentoring ----

route("web", "GET", "/perintis/reports/me", ({ userId }): ReportListItem[] => {
  requireRole(userId, "mentor");
  return reportMonths().map((month) => {
    const r = findReport(userId, month);
    return {
      month,
      status: r?.status ?? "not_started",
      isLate: r?.isLate ?? false,
      verifiedAt: r?.verifiedAt ?? null,
      reviewUnread: !!r?.review && !r.review.readAt,
    };
  });
});

function reportDetail(
  viewerId: number,
  mentorId: number,
  month: string,
): ReportDetail {
  const viewer = participant(viewerId);
  const mentor = participant(mentorId);
  const isSelf = viewerId === mentorId && viewer.isMentor;
  const isCoordinator =
    viewer.isCoordinator && mentor.coordinatorUserId === viewerId;
  if (!isSelf && !isCoordinator)
    throw new ApiError(403, "Laporan ini di luar cakupanmu.");
  const r = findReport(mentorId, month);
  return {
    month,
    mentor: person(mentorId)!,
    coordinator: person(mentor.coordinatorUserId),
    report: r ? toReport(r, !isSelf) : null,
    curriculum: curriculumFor(groupTingkat(mentorId), month),
    tasks: mentorTasks(mentorId, month),
    canEdit: isSelf && (!r || r.status === "draft" || r.status === "returned"),
    unrespondedJournals: unresponded(mentorId, month),
    canUnverify:
      isCoordinator &&
      r?.status === "verified" &&
      !now().isAfter(deadlines(month).unverifyUntil),
  };
}

route(
  "web",
  "GET",
  "/perintis/reports/:mentorId/:month",
  ({ userId, params }) =>
    reportDetail(userId, Number(params.mentorId), requireMonth(params.month)),
);

function ensureReport(userId: number, month: string) {
  requireRole(userId, "mentor");
  requireMonth(month);
  let r = findReport(userId, month);
  if (r && r.status !== "draft" && r.status !== "returned")
    throw new ApiError(409, "Laporan sudah diajukan dan tidak bisa diubah.");
  if (!r) {
    db().seq.report += 1;
    r = {
      id: db().seq.report,
      mentorUserId: userId,
      month,
      sessionDate: null,
      mode: "luring",
      locationOrLink: "",
      curriculumCode: curriculumFor(groupTingkat(userId), month).code,
      deviationReason: null,
      summary: "",
      photos: [],
      caseNote: null,
      caseStatus: null,
      status: "draft",
      submittedAt: null,
      isLate: false,
      review: null,
      verifiedAt: null,
      followup: null,
    };
    db().reports.push(r);
  }
  return r;
}

route<SaveReportInput>(
  "web",
  "PUT",
  "/perintis/reports/me/:month",
  ({ userId, params, body }) => {
    const r = ensureReport(userId, params.month);
    r.sessionDate = body.sessionDate || null;
    r.mode = body.mode;
    r.locationOrLink = body.locationOrLink.trim();
    r.curriculumCode = curriculumFor(groupTingkat(userId), params.month).code;
    r.deviationReason = body.followsCurriculum
      ? null
      : body.deviationReason?.trim() || null;
    r.summary = body.summary.trim();
    r.photos = body.photos;
    r.caseNote = body.caseNote?.trim() || null;
    return reportDetail(userId, userId, params.month);
  },
);

route(
  "web",
  "POST",
  "/perintis/reports/me/:month/submit",
  ({ userId, params }) => {
    const r = ensureReport(userId, params.month);
    if (!r.sessionDate)
      throw new ApiError(422, "Isi tanggal sesi terlebih dulu.");
    if (!r.photos.length)
      throw new ApiError(422, "Unggah minimal satu foto kelompok.");
    if (!r.summary) throw new ApiError(422, "Isi catatan jalannya sesi.");
    if (!r.locationOrLink)
      throw new ApiError(422, "Isi tempat atau tautan sesi.");
    if (!r.submittedAt) {
      r.submittedAt = nowIso();
      r.isLate = now().isAfter(deadlines(params.month).reportDue);
    }
    r.status = "submitted";
    if (r.caseNote && r.caseStatus !== "resolved") r.caseStatus = "open";
    return reportDetail(userId, userId, params.month);
  },
);

route(
  "web",
  "POST",
  "/perintis/reports/me/:month/review/read",
  ({ userId, params }) => {
    const r = findReport(userId, params.month);
    if (r?.review && !r.review.readAt) r.review.readAt = nowIso();
    return { ok: true };
  },
);

route<{ name: string; mime: string; size: number; dataUrl: string | null }>(
  "web",
  "POST",
  "/perintis/uploads",
  ({ body }): UploadedFile => {
    if (body.size > MAX_FILE)
      throw new ApiError(413, "Ukuran berkas maksimal 5 MB.");
    if (!body.mime.startsWith("image/")) throw new ApiError(422, "Hanya foto.");
    return {
      key: nextFileKey("reports", body.name),
      name: body.name,
      mime: body.mime,
      size: body.size,
      previewUrl: body.dataUrl,
    };
  },
);

// ---- koordinator ----

route(
  "web",
  "GET",
  "/perintis/coordinator/overview",
  ({ userId, query }): CoordinatorOverview => {
    requireRole(userId, "coordinator");
    escalateFlags();
    const month = query.get("month") ?? currentReportMonth();
    if (!month) throw new ApiError(404, "Belum ada bulan laporan.");
    const prev = monthKey(monthStart(month).subtract(1, "month"));
    const rows = mentorsOf(userId).map((m) => {
      const journals = journalMonthJournals(m.userId, month);
      const r = findReport(m.userId, month);
      const lowPulse = (j: Journal | null) =>
        !!j &&
        Object.values(j.pulse).filter((v) => v != null && v <= 2).length >= 2;
      return {
        mentor: person(m.userId)!,
        menteeCount: menteesOf(m.userId).length,
        tingkat: groupTingkat(m.userId),
        report: r
          ? {
              id: r.id,
              status: r.status,
              isLate: r.isLate,
              submittedAt: r.submittedAt,
              verifiedAt: r.verifiedAt,
              hasCase: !!r.caseNote,
            }
          : null,
        journals: {
          submitted: journals.filter((j) => j.status !== "draft").length,
          responded: journals.filter((j) => RESPONDED.includes(j.status))
            .length,
          late: journals.filter((j) => j.isLate).length,
        },
        escalatedFlags: journals.filter((j) => j.flag?.status === "escalated")
          .length,
        patternFlags: menteesOf(m.userId).filter(
          (mt) =>
            lowPulse(findJournal(mt.userId, month)) &&
            lowPulse(findJournal(mt.userId, prev)),
        ).length,
        tasks: mentorTasks(m.userId, month),
      };
    });
    return { month, rows };
  },
);

route<ReviewInput>(
  "web",
  "POST",
  "/perintis/reports/:id/review",
  ({ userId, params, body }) => {
    requireRole(userId, "coordinator");
    const r = db().reports.find((x) => x.id === Number(params.id));
    if (!r) throw new ApiError(404, "Laporan tidak ditemukan.");
    if (participant(r.mentorUserId).coordinatorUserId !== userId)
      throw new ApiError(403, "Laporan ini di luar cakupanmu.");
    if (body.decision === "unverify") {
      if (r.status !== "verified")
        throw new ApiError(409, "Laporan belum diverifikasi.");
      if (now().isAfter(deadlines(r.month).unverifyUntil))
        throw new ApiError(
          409,
          "Verifikasi hanya bisa dibatalkan sampai tanggal 20.",
        );
      r.status = "submitted";
      r.verifiedAt = null;
      return reportDetail(userId, r.mentorUserId, r.month);
    }
    if (r.status !== "submitted")
      throw new ApiError(
        409,
        "Hanya laporan yang diajukan yang bisa diperiksa.",
      );
    const appreciation = requireText(body.appreciation, "Apresiasi");
    const note = requireText(body.note, "Catatan");
    if (body.decision === "verify") {
      const pending = unresponded(r.mentorUserId, r.month);
      if (pending)
        throw new ApiError(
          422,
          `Belum bisa diverifikasi: masih ada ${pending} lapbul terkirim yang belum ditanggapi mentor.`,
        );
      r.status = "verified";
      r.verifiedAt = nowIso();
    } else {
      r.status = "returned";
    }
    r.review = {
      appreciation,
      note,
      reviewerKind: "public",
      reviewedBy: profile(userId).name,
      reviewedAt: nowIso(),
      readAt: null,
    };
    return reportDetail(userId, r.mentorUserId, r.month);
  },
);
