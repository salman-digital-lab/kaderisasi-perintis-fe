import { admin, web } from "./client";
import type {
  CoordinatorOverview,
  ExportKind,
  FollowupItem,
  FollowupSource,
  FullProfile,
  ImportKind,
  ImportPreview,
  JournalDetail,
  JournalForMentor,
  JournalListItem,
  Me,
  MentorDashboard,
  ParticipantDetail,
  ParticipantRow,
  ParticipantStatus,
  ReportDetail,
  ReportListItem,
  RespondInput,
  ReviewInput,
  SaveJournalInput,
  SaveReportInput,
  StaffDashboard,
  StaffUser,
  UpdateParticipantInput,
  UploadedFile,
} from "./types";

const qs = (params: Record<string, string | null | undefined>) => {
  const search = new URLSearchParams(
    Object.entries(params).filter((e): e is [string, string] => !!e[1]),
  ).toString();
  return search ? `?${search}` : "";
};

export interface FilePayload {
  name: string;
  mime: string;
  size: number;
  dataUrl: string | null;
}

/** kaderisasi-web-be-go — participants (mentee, mentor, koordinator). */
export const participantApi = {
  login: (email: string, password: string) =>
    web.post<{ token: string }>("/auth/login", { email, password }),
  loginGoogle: (email: string) =>
    web.post<{ token: string }>("/auth/google", { email }),
  me: () => web.get<Me>("/perintis/me"),
  myProfile: () => web.get<FullProfile>("/perintis/me/profile"),
  menteeProfile: (userId: number) =>
    web.get<FullProfile>(`/perintis/mentees/${userId}/profile`),

  myJournals: () => web.get<JournalListItem[]>("/perintis/me/journals"),
  myJournal: (month: string) =>
    web.get<JournalDetail>(`/perintis/me/journals/${month}`),
  saveJournal: (month: string, input: SaveJournalInput) =>
    web.put<JournalDetail>(`/perintis/me/journals/${month}`, input),
  uploadJournalFile: (month: string, field: string, file: FilePayload) =>
    web.post<JournalDetail>(
      `/perintis/me/journals/${month}/files/${field}`,
      file,
    ),
  deleteJournalFile: (month: string, key: string) =>
    web.del<JournalDetail>(
      `/perintis/me/journals/${month}/files/${encodeURIComponent(key)}`,
    ),
  submitJournal: (month: string) =>
    web.post<JournalDetail>(`/perintis/me/journals/${month}/submit`),
  markResponseRead: (month: string) =>
    web.post(`/perintis/me/journals/${month}/response/read`),

  mentorDashboard: (month?: string) =>
    web.get<MentorDashboard>(`/perintis/mentor/dashboard${qs({ month })}`),
  journal: (id: number) =>
    web.get<JournalForMentor>(`/perintis/journals/${id}`),
  respond: (id: number, input: RespondInput) =>
    web.put<JournalForMentor>(`/perintis/journals/${id}/response`, input),
  handleFlag: (id: number, note: string) =>
    web.put<JournalForMentor>(`/perintis/journals/${id}/flag`, { note }),

  myReports: () => web.get<ReportListItem[]>("/perintis/reports/me"),
  report: (mentorId: number, month: string) =>
    web.get<ReportDetail>(`/perintis/reports/${mentorId}/${month}`),
  saveReport: (month: string, input: SaveReportInput) =>
    web.put<ReportDetail>(`/perintis/reports/me/${month}`, input),
  submitReport: (month: string) =>
    web.post<ReportDetail>(`/perintis/reports/me/${month}/submit`),
  markReviewRead: (month: string) =>
    web.post(`/perintis/reports/me/${month}/review/read`),
  uploadPhoto: (file: FilePayload) =>
    web.post<UploadedFile>("/perintis/uploads", file),

  coordinatorOverview: (month?: string) =>
    web.get<CoordinatorOverview>(
      `/perintis/coordinator/overview${qs({ month })}`,
    ),
  reviewReport: (id: number, input: ReviewInput) =>
    web.post<ReportDetail>(`/perintis/reports/${id}/review`, input),
};

/** kaderisasi-admin-be-go — pengelola (staff). */
export const staffApi = {
  login: (email: string, password: string) =>
    admin.post<{ token: string }>("/auth/login", { email, password }),
  loginGoogle: (email: string) =>
    admin.post<{ token: string }>("/auth/google", { email }),
  me: () => admin.get<StaffUser>("/auth/me"),
  dashboard: (month?: string) =>
    admin.get<StaffDashboard>(`/perintis/dashboard${qs({ month })}`),
  followups: (filters: { source?: string; status?: string }) =>
    admin.get<FollowupItem[]>(`/perintis/followups${qs(filters)}`),
  resolveFollowup: (source: FollowupSource, id: number, note: string) =>
    admin.put(`/perintis/followups/${source}/${id}`, { note }),
  participants: (filters: { role?: string; status?: string; q?: string }) =>
    admin.get<ParticipantRow[]>(`/perintis/participants${qs(filters)}`),
  participant: (id: number) =>
    admin.get<ParticipantDetail>(`/perintis/participants/${id}`),
  updateParticipant: (id: number, input: UpdateParticipantInput) =>
    admin.put<ParticipantDetail>(`/perintis/participants/${id}`, input),
  moveMentee: (id: number, mentorUserId: number | null) =>
    admin.put<ParticipantDetail>(`/perintis/participants/${id}/mentor`, {
      mentorUserId,
    }),
  setStatus: (id: number, status: ParticipantStatus, reason?: string) =>
    admin.put<ParticipantDetail>(`/perintis/participants/${id}/status`, {
      status,
      reason,
    }),
  journal: (id: number) =>
    admin.get<JournalForMentor>(`/perintis/journals/${id}`),
  reopenJournal: (menteeUserId: number, month: string, reason: string) =>
    admin.post("/perintis/journals/reopen", { menteeUserId, month, reason }),
  importPreview: (kind: ImportKind, csv: string) =>
    admin.post<ImportPreview>("/perintis/imports/preview", { kind, csv }),
  importApply: (kind: ImportKind, csv: string) =>
    admin.post<{ applied: number }>("/perintis/imports/apply", { kind, csv }),
  exportCsv: (kind: ExportKind, month?: string) =>
    admin.get<{ filename: string; csv: string }>(
      `/perintis/exports/${kind}${qs({ month })}`,
    ),
};
