import { ApiError } from "@/api/errors";
import type {
  Category,
  CoordinatorRecap,
  ExportKind,
  FollowupItem,
  FollowupSource,
  ImportKind,
  ImportPreview,
  ImportPreviewRow,
  Indicator,
  Participant,
  ParticipantDetail,
  ParticipantRow,
  ParticipantStatus,
  StaffDashboard,
  UpdateParticipantInput,
} from "@/api/types";
import {
  CATEGORY_LABEL,
  JOURNAL_STATUS,
  REPORT_STATUS,
} from "@/content/labels";
import {
  currentReportMonth,
  deadlines,
  fmtDate,
  monthLabel,
  nowIso,
  reportMonths,
  tz,
} from "@/lib/time";
import {
  escalateFlags,
  findJournal,
  findReport,
  journalById,
  listItem,
  menteesOf,
  mentorsOf,
  mentorTasks,
  participant,
  person,
  profile,
  RESPONDED,
  requireText,
  rolesOf,
  tingkatOf,
} from "./logic";
import { journalForReader } from "./participantRoutes";
import { mockToken, route } from "./router";
import { db } from "./store";

function staff(id: number) {
  const s = db().staff.find((x) => x.id === id);
  if (!s) throw new ApiError(401, "Sesi staf berakhir.");
  return s;
}

function requirePermission(id: number, permission: string) {
  const s = staff(id);
  if (!s.permissions.includes(permission))
    throw new ApiError(403, "Akunmu tidak punya izin untuk tindakan ini.");
  return s;
}

function monthParam(value: string | null): string {
  const month = value ?? currentReportMonth();
  if (!month) throw new ApiError(404, "Belum ada bulan laporan.");
  return month;
}

route<{ email: string; password: string }>(
  "admin",
  "POST",
  "/auth/login",
  ({ body }) => {
    const s = db().staff.find(
      (x) => x.email === body.email?.trim().toLowerCase(),
    );
    if (!s || !body.password)
      throw new ApiError(401, "Email atau kata sandi salah.");
    return { token: mockToken("admin", s.id) };
  },
  { isPublic: true },
);

route<{ email: string }>(
  "admin",
  "POST",
  "/auth/google",
  ({ body }) => {
    const s = db().staff.find(
      (x) => x.email === body.email?.trim().toLowerCase(),
    );
    if (!s) throw new ApiError(403, "Akun Google ini bukan akun staf.");
    return { token: mockToken("admin", s.id) };
  },
  { isPublic: true },
);

route("admin", "GET", "/auth/me", ({ userId }) => staff(userId));

// ---- dashboard ----

function activeMentees(): Participant[] {
  return db().participants.filter((p) => p.isMentee && p.status === "active");
}

function activeMentors(): Participant[] {
  return db().participants.filter(
    (p) =>
      p.isMentor && p.status === "active" && menteesOf(p.userId).length > 0,
  );
}

const pct = (
  key: string,
  label: string,
  numerator: number,
  denominator: number,
  target: number,
): Indicator => ({
  key,
  label,
  numerator,
  denominator,
  target,
});

route(
  "admin",
  "GET",
  "/perintis/dashboard",
  ({ userId, query }): StaffDashboard => {
    requirePermission(userId, "perintis.recap.read");
    escalateFlags();
    const month = monthParam(query.get("month"));
    const due = deadlines(month);
    const mentees = activeMentees().filter((m) => m.mentorUserId);
    const journals = db().journals.filter((j) => j.month === month);
    const submitted = journals.filter((j) => j.status !== "draft");
    const mentors = activeMentors();
    const reports = mentors.map((m) => findReport(m.userId, month));
    const flags = journals.filter((j) => j.flag);
    const indicators = [
      pct(
        "ontime",
        "Lapbul terkirim tepat waktu",
        submitted.filter((j) => !j.isLate).length,
        mentees.length,
        0.85,
      ),
      pct(
        "responded",
        "Lapbul ditanggapi sesuai tenggat",
        submitted.filter(
          (j) =>
            RESPONDED.includes(j.status) &&
            j.response &&
            !tz(j.response.respondedAt).isAfter(due.mentorDue),
        ).length,
        submitted.length,
        1,
      ),
      pct(
        "reports",
        "Laporan mentoring diajukan",
        reports.filter((r) => r && r.status !== "draft").length,
        mentors.length,
        1,
      ),
      pct(
        "verified",
        "Laporan mentoring diverifikasi",
        reports.filter((r) => r?.status === "verified").length,
        mentors.length,
        1,
      ),
      pct(
        "flags",
        "Bendera ditindaklanjuti ≤ 3 hari",
        flags.filter(
          (j) =>
            j.flag?.handledAt &&
            !tz(j.flag.handledAt).isAfter(tz(j.flag.dueAt)),
        ).length,
        flags.length,
        1,
      ),
    ];
    const byCoordinator: CoordinatorRecap[] = db()
      .participants.filter((p) => p.isCoordinator && p.status === "active")
      .map((c) => {
        const mentorIds = mentorsOf(c.userId).map((m) => m.userId);
        const js = journals.filter(
          (j) => j.mentorUserId && mentorIds.includes(j.mentorUserId),
        );
        const rs = mentorIds.map((id) => findReport(id, month));
        return {
          coordinator: person(c.userId)!,
          mentors: mentorIds.length,
          mentees: mentorIds.reduce((n, id) => n + menteesOf(id).length, 0),
          submitted: js.filter((j) => j.status !== "draft").length,
          late: js.filter((j) => j.isLate).length,
          responded: js.filter((j) => RESPONDED.includes(j.status)).length,
          reportsSubmitted: rs.filter((r) => r && r.status !== "draft").length,
          reportsVerified: rs.filter((r) => r?.status === "verified").length,
          activeFlags: js.filter(
            (j) => j.flag?.status === "open" || j.flag?.status === "escalated",
          ).length,
        };
      });
    return {
      month,
      indicators,
      byCoordinator,
      followupsOpen: followups().filter((f) => f.status === "open").length,
      withoutMentor:
        activeMentees().filter((m) => !m.mentorUserId).length +
        db().participants.filter(
          (p) => p.isMentee && p.status === "pending" && !p.mentorUserId,
        ).length,
    };
  },
);

// ---- follow-ups ----

function coordinatorNameOf(mentorId: number | null): string | null {
  if (!mentorId) return null;
  return person(participant(mentorId).coordinatorUserId)?.name ?? null;
}

function followups(): FollowupItem[] {
  const items: FollowupItem[] = [];
  for (const j of db().journals) {
    const mentee = person(j.menteeUserId)!.name;
    if (j.response?.flagReason && (j.status === "flagged" || j.followup)) {
      items.push({
        source: "journal",
        id: j.id,
        month: j.month,
        subject: mentee,
        mentorName: person(j.mentorUserId)?.name ?? null,
        coordinatorName: coordinatorNameOf(j.mentorUserId),
        detail: j.response.flagReason,
        openedAt: j.response.respondedAt,
        status: j.status === "flagged" ? "open" : "handled",
        handled: j.status === "flagged" ? null : j.followup,
      });
    }
    if (
      j.flag &&
      (j.flag.status === "escalated" || j.flag.status === "resolved")
    ) {
      items.push({
        source: "flag",
        id: j.id,
        month: j.month,
        subject: mentee,
        mentorName: person(j.mentorUserId)?.name ?? null,
        coordinatorName: coordinatorNameOf(j.mentorUserId),
        detail: `${j.flag.trigger === "low_pulse" ? "Dua skala pulse ≤ 2" : j.flag.trigger === "contact_request" ? "Ingin dihubungi" : "Pulse rendah & ingin dihubungi"} · pulse energi ${j.pulse.energy}, akademik ${j.pulse.academic}, keuangan ${j.pulse.finance}, relasi ${j.pulse.relation}.${j.flag.privateNote ? ` Catatan mentor: ${j.flag.privateNote}` : " Mentor belum menandai sudah dihubungi."}`,
        openedAt: j.submittedAt ?? j.updatedAt,
        status: j.flag.status === "resolved" ? "handled" : "open",
        handled: j.flag.status === "resolved" ? j.followup : null,
      });
    }
  }
  for (const r of db().reports) {
    if (!r.caseNote || !r.caseStatus) continue;
    items.push({
      source: "report",
      id: r.id,
      month: r.month,
      subject: `Kelompok ${person(r.mentorUserId)!.name}`,
      mentorName: person(r.mentorUserId)!.name,
      coordinatorName: coordinatorNameOf(r.mentorUserId),
      detail: r.caseNote,
      openedAt: r.submittedAt ?? nowIso(),
      status: r.caseStatus === "open" ? "open" : "handled",
      handled: r.followup,
    });
  }
  return items.sort((a, b) =>
    a.status !== b.status
      ? a.status === "open"
        ? -1
        : 1
      : a.openedAt.localeCompare(b.openedAt),
  );
}

route("admin", "GET", "/perintis/followups", ({ userId, query }) => {
  requirePermission(userId, "perintis.followups.manage");
  escalateFlags();
  const source = query.get("source");
  const status = query.get("status");
  return followups().filter(
    (f) => (!source || f.source === source) && (!status || f.status === status),
  );
});

route<{ note: string }>(
  "admin",
  "PUT",
  "/perintis/followups/:source/:id",
  ({ userId, params, body }) => {
    const s = requirePermission(userId, "perintis.followups.manage");
    const note = requireText(body.note, "Catatan penanganan", 1000);
    const followup = { by: s.name, at: nowIso(), note };
    const source = params.source as FollowupSource;
    const id = Number(params.id);
    if (source === "journal") {
      const j = journalById(id);
      if (j.status !== "flagged") throw new ApiError(409, "Sudah ditangani.");
      j.status = "accepted";
      j.followup = followup;
    } else if (source === "flag") {
      const j = journalById(id);
      if (!j.flag || j.flag.status === "resolved")
        throw new ApiError(409, "Sudah ditangani.");
      j.flag.status = "resolved";
      j.followup = followup;
    } else if (source === "report") {
      const r = db().reports.find((x) => x.id === id);
      if (!r || r.caseStatus !== "open")
        throw new ApiError(409, "Sudah ditangani.");
      r.caseStatus = "resolved";
      r.followup = followup;
    } else {
      throw new ApiError(404, "Sumber tidak dikenal.");
    }
    return { ok: true };
  },
);

// ---- participants ----

function rowOf(p: Participant): ParticipantRow {
  const prof = profile(p.userId);
  const mentor = p.mentorUserId ? participant(p.mentorUserId) : null;
  return {
    userId: p.userId,
    name: prof.name,
    email: prof.email,
    nim: p.nim,
    roles: rolesOf({ ...p, status: "active" }),
    category: p.category,
    kipK: p.kipK,
    university: prof.university,
    tingkat: tingkatOf(p.userId),
    mentorName: person(p.mentorUserId)?.name ?? null,
    coordinatorName:
      person(
        p.isMentor ? p.coordinatorUserId : (mentor?.coordinatorUserId ?? null),
      )?.name ?? null,
    menteeCount: p.isMentor ? menteesOf(p.userId).length : 0,
    status: p.status,
    hasAccount: p.hasAccount,
    clubOk: (db().clubs[p.userId] ?? []).length > 0,
  };
}

route("admin", "GET", "/perintis/participants", ({ userId, query }) => {
  requirePermission(userId, "perintis.participants.read");
  const role = query.get("role");
  const status = query.get("status");
  const q = query.get("q")?.toLowerCase().trim();
  return db()
    .participants.map(rowOf)
    .filter(
      (r) =>
        (!role || r.roles.includes(role as never)) &&
        (!status || r.status === status) &&
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.email.includes(q) ||
          (r.nim ?? "").includes(q)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
});

function detail(id: number): ParticipantDetail {
  const p = participant(id);
  return {
    row: rowOf(p),
    participant: p,
    profile: profile(id),
    mentees: menteesOf(id).map((m) => person(m.userId)!),
    mentors: mentorsOf(id).map((m) => person(m.userId)!),
    journals: p.isMentee ? reportMonths().map((m) => listItem(id, m)) : [],
  };
}

route("admin", "GET", "/perintis/participants/:id", ({ userId, params }) => {
  requirePermission(userId, "perintis.participants.read");
  return detail(Number(params.id));
});

route<UpdateParticipantInput>(
  "admin",
  "PUT",
  "/perintis/participants/:id",
  ({ userId, params, body }) => {
    requirePermission(userId, "perintis.participants.manage");
    const p = participant(Number(params.id));
    if (!body.isMentee && !body.isMentor && !body.isCoordinator)
      throw new ApiError(422, "Pilih minimal satu peran.");
    if (p.isMentor && !body.isMentor && menteesOf(p.userId).length)
      throw new ApiError(
        409,
        "Peran mentor tidak bisa dicabut selama masih punya mentee aktif.",
      );
    if (p.isCoordinator && !body.isCoordinator && mentorsOf(p.userId).length)
      throw new ApiError(
        409,
        "Peran koordinator tidak bisa dicabut selama masih membawahi mentor.",
      );
    if (body.isMentee) {
      if (!body.nim?.trim()) throw new ApiError(422, "NIM wajib untuk mentee.");
      if (!body.category)
        throw new ApiError(422, "Kategori wajib untuk mentee.");
      if (body.kipK == null)
        throw new ApiError(422, "Status KIP-K wajib untuk mentee.");
      const dup = db().participants.find(
        (x) => x.nim === body.nim?.trim() && x.userId !== p.userId,
      );
      if (dup) throw new ApiError(409, "NIM sudah dipakai peserta lain.");
    }
    if (
      body.coordinatorUserId != null &&
      !participant(body.coordinatorUserId).isCoordinator
    )
      throw new ApiError(422, "Koordinator tidak valid.");
    Object.assign(p, {
      isMentee: body.isMentee,
      isMentor: body.isMentor,
      isCoordinator: body.isCoordinator,
      nim: body.isMentee ? body.nim?.trim() : null,
      kipK: body.isMentee ? body.kipK : null,
      category: body.isMentee ? body.category : null,
      kaderisasiOverride: body.isMentee ? body.kaderisasiOverride : null,
      kaderisasiOverrideNote: body.isMentee
        ? body.kaderisasiOverrideNote?.trim() || null
        : null,
      mentorUserId: body.isMentee ? p.mentorUserId : null,
      coordinatorUserId: body.isMentor ? body.coordinatorUserId : null,
    });
    return detail(p.userId);
  },
);

route<{ mentorUserId: number | null }>(
  "admin",
  "PUT",
  "/perintis/participants/:id/mentor",
  ({ userId, params, body }) => {
    requirePermission(userId, "perintis.participants.manage");
    const p = participant(Number(params.id));
    if (!p.isMentee) throw new ApiError(422, "Hanya mentee yang punya mentor.");
    if (body.mentorUserId != null) {
      const m = participant(body.mentorUserId);
      if (!m.isMentor || m.status === "inactive")
        throw new ApiError(422, "Mentor tidak valid.");
      if (m.userId === p.userId)
        throw new ApiError(422, "Mentee tidak bisa menjadi mentornya sendiri.");
      if (m.status === "reserve") m.status = "active";
    }
    p.mentorUserId = body.mentorUserId;
    if (p.status === "pending" && body.mentorUserId) p.status = "active";
    // The open month's journal moves with the mentee (PRD §8.7 no. 3).
    const month = currentReportMonth();
    const j = month ? findJournal(p.userId, month) : null;
    if (j && !RESPONDED.includes(j.status)) j.mentorUserId = body.mentorUserId;
    return detail(p.userId);
  },
);

route<{ status: ParticipantStatus; reason?: string }>(
  "admin",
  "PUT",
  "/perintis/participants/:id/status",
  ({ userId, params, body }) => {
    requirePermission(userId, "perintis.participants.manage");
    const p = participant(Number(params.id));
    if (body.status === "inactive") {
      p.inactiveReason = requireText(body.reason, "Alasan nonaktif", 500);
      if (p.isMentor && menteesOf(p.userId).length)
        throw new ApiError(
          409,
          "Pindahkan dulu mentee mentor ini ke mentor lain.",
        );
    } else {
      p.inactiveReason = null;
    }
    p.status = body.status;
    return detail(p.userId);
  },
);

// ---- journals (content read + reopen) ----

route("admin", "GET", "/perintis/journals/:id", ({ userId, params }) => {
  requirePermission(userId, "perintis.content.read");
  return journalForReader(
    journalById(Number(params.id)),
    false,
    "Pengelola hanya membaca.",
  );
});

route<{ reason: string }>(
  "admin",
  "POST",
  "/perintis/journals/:id/reopen",
  ({ userId, params, body }) => {
    requirePermission(userId, "perintis.participants.manage");
    const j = journalById(Number(params.id));
    if (j.status !== "draft")
      throw new ApiError(
        409,
        "Hanya lapbul yang belum terkirim yang bisa dibuka kembali.",
      );
    j.reopenReason = requireText(body.reason, "Alasan", 500);
    return { ok: true };
  },
);

route<{ menteeUserId: number; month: string; reason: string }>(
  "admin",
  "POST",
  "/perintis/journals/reopen",
  ({ userId, body }) => {
    requirePermission(userId, "perintis.participants.manage");
    const reason = requireText(body.reason, "Alasan", 500);
    let j = findJournal(body.menteeUserId, body.month);
    if (j && j.status !== "draft")
      throw new ApiError(
        409,
        "Hanya lapbul yang belum terkirim yang bisa dibuka kembali.",
      );
    if (!j) {
      const p = participant(body.menteeUserId);
      db().seq.journal += 1;
      j = {
        id: db().seq.journal,
        menteeUserId: p.userId,
        month: body.month,
        mentorUserId: p.mentorUserId,
        category: p.category ?? "dasar",
        formVersion: 1,
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
    }
    j.reopenReason = reason;
    return { ok: true };
  },
);

// ---- import ----

const IMPORT_COLUMNS: Record<ImportKind, string[]> = {
  mentee: ["nim", "nama", "email", "kategori", "kip_k"],
  mentor: ["email", "email_koordinator"],
  matching: ["nim", "email_mentor"],
};

function parseCsv(csv: string): string[][] {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((c) => c.trim()));
}

function preview(kind: ImportKind, csv: string): ImportPreview {
  const columns = IMPORT_COLUMNS[kind];
  if (!columns) throw new ApiError(422, "Jenis impor tidak dikenal.");
  const [header, ...lines] = parseCsv(csv);
  if (!header || header.join(",").toLowerCase() !== columns.join(","))
    throw new ApiError(422, `Kolom harus persis: ${columns.join(", ")}`);
  const seen = new Map<string, number>();
  const byEmail = (email: string) =>
    db().profiles.find((p) => p.email === email.toLowerCase());
  const rows: ImportPreviewRow[] = lines.map((values, i) => {
    const line = i + 2;
    const row = (result: ImportPreviewRow["result"], message: string) => ({
      line,
      values,
      result,
      message,
    });
    if (values.length !== columns.length)
      return row("error", "Jumlah kolom tidak sesuai.");
    if (kind === "mentee") {
      const [nim, , email, kategori, kip] = values;
      if (seen.has(nim))
        return row("error", `NIM ganda dengan baris ${seen.get(nim)}`);
      seen.set(nim, line);
      if (!["dasar", "biaya_hidup"].includes(kategori))
        return row("error", `Kategori tidak dikenal: ${kategori}`);
      if (!["ya", "tidak"].includes(kip.toLowerCase()))
        return row("error", "kip_k harus ya/tidak");
      const prof = byEmail(email);
      const nimOwner = db().participants.find((p) => p.nim === nim);
      if (nimOwner && nimOwner.userId !== prof?.userId)
        return row("error", "NIM sudah dipakai peserta lain");
      if (!prof) return row("new", "Baru · akun belum aktif (no_account)");
      const existing = db().participants.find((p) => p.userId === prof.userId);
      if (existing?.isMentee)
        return row(
          "warning",
          "Sudah terdaftar sebagai mentee · data diperbarui",
        );
      return row("match", `Cocok · akun kaderisasi ${prof.name}`);
    }
    if (kind === "mentor") {
      const [email, coordEmail] = values;
      const prof = byEmail(email);
      const coord = byEmail(coordEmail);
      if (
        !coord ||
        !db().participants.find(
          (p) => p.userId === coord.userId && p.isCoordinator,
        )
      )
        return row("error", "Email koordinator tidak ditemukan");
      if (!prof) return row("new", "Baru · akun mentor dibuat (no_account)");
      return row("match", `Cocok · ${prof.name}`);
    }
    const [nim, mentorEmail] = values;
    const mentee = db().participants.find((p) => p.nim === nim && p.isMentee);
    if (!mentee) return row("error", "NIM tidak ditemukan");
    const mentor = byEmail(mentorEmail);
    if (
      !mentor ||
      !db().participants.find((p) => p.userId === mentor.userId && p.isMentor)
    )
      return row("error", "Email mentor tidak ditemukan");
    return row("match", `${profile(mentee.userId).name} → ${mentor.name}`);
  });
  return {
    kind,
    columns,
    rows,
    canApply: rows.length > 0 && rows.every((r) => r.result !== "error"),
  };
}

route<{ kind: ImportKind; csv: string }>(
  "admin",
  "POST",
  "/perintis/imports/preview",
  ({ userId, body }) => {
    requirePermission(userId, "perintis.participants.manage");
    return preview(body.kind, body.csv);
  },
);

route<{ kind: ImportKind; csv: string }>(
  "admin",
  "POST",
  "/perintis/imports/apply",
  ({ userId, body }) => {
    requirePermission(userId, "perintis.participants.manage");
    const result = preview(body.kind, body.csv);
    if (!result.canApply)
      throw new ApiError(
        422,
        "Masih ada baris galat. Perbaiki berkas lalu pratinjau ulang.",
      );
    const ensureUser = (email: string, name: string): number => {
      const found = db().profiles.find((p) => p.email === email.toLowerCase());
      if (found) return found.userId;
      db().seq.user += 1;
      const id = db().seq.user;
      db().profiles.push({
        userId: id,
        name,
        email: email.toLowerCase(),
        gender: "L",
        phone: "-",
        instagram: null,
        linkedin: null,
        university: "Institut Teknologi Bandung",
        major: "-",
        intakeYear: 2026,
        domicile: "-",
        level: "Jamaah",
        sscStatus: "Belum",
        lmdStatus: "Belum",
      });
      return id;
    };
    const ensureParticipant = (id: number): Participant => {
      let p = db().participants.find((x) => x.userId === id);
      if (!p) {
        p = {
          userId: id,
          isMentee: false,
          isMentor: false,
          isCoordinator: false,
          nim: null,
          kipK: null,
          category: null,
          kaderisasiOverride: null,
          kaderisasiOverrideNote: null,
          mentorUserId: null,
          coordinatorUserId: null,
          status: "active",
          inactiveReason: null,
          hasAccount: !!db().profiles.find(
            (x) => x.userId === id && x.phone !== "-",
          ),
        };
        db().participants.push(p);
      }
      return p;
    };
    for (const r of result.rows) {
      if (body.kind === "mentee") {
        const [nim, nama, email, kategori, kip] = r.values;
        const p = ensureParticipant(ensureUser(email, nama));
        Object.assign(p, {
          isMentee: true,
          nim,
          category: kategori as Category,
          kipK: kip.toLowerCase() === "ya",
        });
      } else if (body.kind === "mentor") {
        const [email, coordEmail] = r.values;
        const p = ensureParticipant(ensureUser(email, email.split("@")[0]));
        p.isMentor = true;
        p.coordinatorUserId = db().profiles.find(
          (x) => x.email === coordEmail.toLowerCase(),
        )!.userId;
      } else {
        const [nim, mentorEmail] = r.values;
        const p = db().participants.find((x) => x.nim === nim)!;
        p.mentorUserId = db().profiles.find(
          (x) => x.email === mentorEmail.toLowerCase(),
        )!.userId;
      }
    }
    return { applied: result.rows.length };
  },
);

// ---- export ----

function csvLine(
  values: (string | number | boolean | null | undefined)[],
): string {
  return values
    .map((v) => {
      const s =
        v == null
          ? ""
          : typeof v === "boolean"
            ? v
              ? "ya"
              : "tidak"
            : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}

route(
  "admin",
  "GET",
  "/perintis/exports/:kind",
  ({ userId, params, query }) => {
    requirePermission(userId, "perintis.recap.export");
    const month = monthParam(query.get("month"));
    const kind = params.kind as ExportKind;
    const label = monthLabel(month);
    const mentees = db().participants.filter((p) => p.isMentee);
    const mentors = db().participants.filter(
      (p) => p.isMentor && p.status !== "inactive",
    );
    const coordName = (mentorId: number | null) =>
      mentorId
        ? (person(participant(mentorId).coordinatorUserId)?.name ?? "")
        : "";
    let header: string[] = [];
    let rows: (string | number | boolean | null)[][] = [];
    if (kind === "rekap-mentee") {
      const months = reportMonths().slice().reverse();
      header = [
        "NIM",
        "Nama",
        "Kampus",
        "Prodi",
        "Angkatan",
        "KIP-K",
        "Kategori",
        "Mentor",
        "Koordinator",
        "Status kaderisasi",
        ...months.map((m) => `Lapbul ${monthLabel(m)}`),
        "Unit/club",
      ];
      rows = mentees.map((p) => {
        const prof = profile(p.userId);
        return [
          p.nim,
          prof.name,
          prof.university,
          prof.major,
          prof.intakeYear,
          p.kipK,
          p.category ? CATEGORY_LABEL[p.category] : "",
          person(p.mentorUserId)?.name ?? "",
          coordName(p.mentorUserId),
          p.kaderisasiOverride ?? prof.lmdStatus,
          ...months.map((m) => {
            const j = findJournal(p.userId, m);
            return j
              ? `${JOURNAL_STATUS[j.status].label}${j.isLate ? " (terlambat)" : ""}`
              : "Belum mengisi";
          }),
          (db().clubs[p.userId] ?? []).length ? "ya" : "tidak",
        ];
      });
    } else if (kind === "tugas-mentor") {
      header = [
        "Mentor",
        "Koordinator",
        "Kelompok",
        "Bulan",
        "T1",
        "T2",
        "T3",
        "Status laporan",
        "Tanggal verifikasi",
      ];
      rows = mentors.map((m) => {
        const t = mentorTasks(m.userId, month);
        const r = findReport(m.userId, month);
        return [
          person(m.userId)!.name,
          coordName(m.userId),
          `${menteesOf(m.userId).length} mentee`,
          label,
          t.t1,
          t.t2,
          t.t3,
          REPORT_STATUS[r?.status ?? "not_started"].label,
          r?.verifiedAt ? fmtDate(r.verifiedAt) : "",
        ];
      });
    } else if (kind === "status-lapbul") {
      header = [
        "NIM",
        "Nama",
        "Kelompok (mentor)",
        "Status",
        "Dikirim",
        "Terlambat",
        "Ditanggapi",
        "Keputusan",
      ];
      rows = mentees.map((p) => {
        const j = findJournal(p.userId, month);
        return [
          p.nim,
          profile(p.userId).name,
          person(j?.mentorUserId ?? p.mentorUserId)?.name ?? "",
          JOURNAL_STATUS[j?.status ?? "not_started"].label,
          j?.submittedAt ? fmtDate(j.submittedAt) : "",
          j?.isLate ?? false,
          j?.response ? fmtDate(j.response.respondedAt) : "",
          j && RESPONDED.includes(j.status)
            ? JOURNAL_STATUS[j.status].label
            : "",
        ];
      });
    } else if (kind === "laporan-mentoring") {
      header = [
        "Kelompok (mentor)",
        "Mentor",
        "Koordinator",
        "Bulan",
        "Tanggal sesi",
        "Tema",
        "Status",
        "Terlambat",
        "Tanggal verifikasi",
      ];
      rows = mentors.map((m) => {
        const r = findReport(m.userId, month);
        const name = person(m.userId)!.name;
        return [
          `Kelompok ${name}`,
          name,
          coordName(m.userId),
          label,
          r?.sessionDate ? fmtDate(r.sessionDate) : "",
          r ? (r.deviationReason ?? r.curriculumCode) : "",
          REPORT_STATUS[r?.status ?? "not_started"].label,
          r?.isLate ?? false,
          r?.verifiedAt ? fmtDate(r.verifiedAt) : "",
        ];
      });
    } else if (kind === "data-peserta") {
      header = [
        "Nama",
        "Email",
        "NIM",
        "Peran",
        "Kategori",
        "Kampus",
        "Tingkat",
        "Mentor",
        "Koordinator",
        "Jumlah mentee",
        "Status",
      ];
      rows = db()
        .participants.map(rowOf)
        .map((r) => [
          r.name,
          r.email,
          r.nim,
          r.roles.join("+"),
          r.category ? CATEGORY_LABEL[r.category] : "",
          r.university,
          r.tingkat,
          r.mentorName,
          r.coordinatorName,
          r.menteeCount,
          r.status,
        ]);
    } else {
      throw new ApiError(404, "Jenis ekspor tidak dikenal.");
    }
    return {
      filename: `perintis-${kind}-${month.slice(0, 7)}.csv`,
      csv: [csvLine(header), ...rows.map(csvLine)].join("\n"),
    };
  },
);
