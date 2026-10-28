import type { JournalWindow } from "@/lib/time";

export type Role = "mentee" | "mentor" | "coordinator";
export type Category = "dasar" | "biaya_hidup";
export type KaderisasiOverride = "lmd_lama" | "lmd_242" | "setara" | "belum";
export type ParticipantStatus = "active" | "pending" | "reserve" | "inactive";
export type CadreLevel = "Jamaah" | "Aktivis" | "Kader" | "Kader Lanjut";

export interface Profile {
  userId: number;
  name: string;
  email: string;
  gender: "L" | "P";
  phone: string;
  instagram: string | null;
  linkedin: string | null;
  university: string;
  major: string;
  intakeYear: number;
  domicile: string;
  level: CadreLevel;
  sscStatus: string;
  lmdStatus: string;
}

export interface Participant {
  userId: number;
  isMentee: boolean;
  isMentor: boolean;
  isCoordinator: boolean;
  nim: string | null;
  kipK: boolean | null;
  category: Category | null;
  kaderisasiOverride: KaderisasiOverride | null;
  kaderisasiOverrideNote: string | null;
  mentorUserId: number | null;
  coordinatorUserId: number | null;
  status: ParticipantStatus;
  inactiveReason: string | null;
  hasAccount: boolean;
}

export interface PersonSummary {
  userId: number;
  name: string;
  phone: string | null;
}

export interface ActivityItem {
  name: string;
  category: string;
  date: string;
  status: string;
  certificate: boolean;
}

export interface ClubItem {
  name: string;
  role: string;
  status: string;
}

export interface Achievement {
  name: string;
  level: string;
  year: number;
  status: string;
}

export interface Markers {
  lapbulPending: boolean;
  responseUnread: boolean;
  journalsToRespond: number;
  openFlags: number;
  reportPending: boolean;
  reportReviewUnread: boolean;
  reportsToVerify: number;
}

export interface Me {
  profile: Profile;
  participant: Participant;
  roles: Role[];
  mentor: PersonSummary | null;
  coordinator: PersonSummary | null;
  markers: Markers;
}

export interface FullProfile {
  profile: Profile;
  participant: Participant;
  tingkat: number;
  mentor: PersonSummary | null;
  coordinator: PersonSummary | null;
  activities: ActivityItem[];
  clubs: ClubItem[];
  achievements: Achievement[];
  /** Hidden for koordinator (economic/family/health data). */
  sensitiveHidden: boolean;
  summary: {
    month: string | null;
    journalStatus: JournalStatus | "not_started" | null;
    lastResponse: string | null;
    sessionDate: string | null;
  };
}

// ---- Catatan Perjalanan (lapbul) ----

export type JournalStatus =
  | "draft"
  | "submitted"
  | "accepted"
  | "revision_requested"
  | "revised"
  | "flagged";

export type FlagStatus = "open" | "handled" | "escalated" | "resolved";
export type FlagTrigger = "low_pulse" | "contact_request" | "both";
export type TargetResult = "tercapai" | "sebagian" | "belum";

export interface UploadedFile {
  key: string;
  name: string;
  mime: string;
  size: number;
  /** Mock only: a data URL so images can be previewed without storage. */
  previewUrl: string | null;
}

export interface JournalFile extends UploadedFile {
  field: "s3b" | "s7khs";
}

export interface Pulse {
  energy: number | null;
  academic: number | null;
  finance: number | null;
  relation: number | null;
}

export interface JournalAnswers {
  s1b?: string;
  s1c?: string;
  s1d?: string;
  s2a?: TargetResult[];
  s2b?: string;
  targets?: string[];
  s3a?: string;
  s5aPages?: number | null;
  s5aVerse?: string;
  s5b?: string;
  s5cKinds?: string[];
  s5cText?: string;
  s5d?: number | null;
  s6?: string;
  s7ip?: number | null;
  s8aChanged?: boolean | null;
  s8aText?: string;
  s8b?: string[];
}

export interface JournalResponse {
  appreciation: string;
  text: string;
  revisionRequest: string | null;
  flagReason: string | null;
  respondedBy: string;
  respondedAt: string;
  readAt: string | null;
}

export interface JournalFlag {
  trigger: FlagTrigger;
  status: FlagStatus;
  dueAt: string;
  handledBy: string | null;
  handledAt: string | null;
  privateNote: string | null;
}

export interface Followup {
  by: string;
  at: string;
  note: string;
}

export interface Journal {
  id: number;
  menteeUserId: number;
  month: string;
  mentorUserId: number | null;
  category: Category;
  formVersion: number;
  status: JournalStatus;
  answers: JournalAnswers;
  files: JournalFile[];
  pulse: Pulse;
  wantsContact: boolean;
  honestyConfirmedAt: string | null;
  submittedAt: string | null;
  isLate: boolean;
  revision: number;
  reopenReason: string | null;
  response: JournalResponse | null;
  flag: JournalFlag | null;
  followup: Followup | null;
  updatedAt: string;
}

export type JournalListStatus = JournalStatus | "not_started";

export interface JournalListItem {
  journalId: number | null;
  month: string;
  status: JournalListStatus;
  isLate: boolean;
  submittedAt: string | null;
  responseUnread: boolean;
  window: JournalWindow;
}

export interface AutoData {
  name: string;
  nim: string | null;
  university: string;
  major: string;
  intakeYear: number;
  tingkat: number;
  category: Category;
  mentorName: string | null;
  coordinatorName: string | null;
  session: { date: string; theme: string } | null;
  activities: string[];
  sscStatus: string;
  lmdStatus: string;
  clubs: string[];
}

export interface JournalDetail {
  month: string;
  category: Category;
  window: JournalWindow;
  journal: Journal | null;
  autoData: AutoData;
  previousTargets: string[] | null;
  canEdit: boolean;
  lockedReason: string | null;
  revisionDueAt: string | null;
}

export interface SaveJournalInput {
  revision: number;
  answers: JournalAnswers;
  pulse: Pulse;
  wantsContact: boolean;
  honestyConfirmed: boolean;
}

// ---- Mentor ----

export interface DashboardRow {
  /** `""` when the mentee's kategori is not set yet. */
  mentee: PersonSummary & { category: Category | ""; tingkat: number };
  journalId: number | null;
  status: JournalListStatus;
  isLate: boolean;
  submittedAt: string | null;
  flag: (JournalFlag & { journalId: number }) | null;
  inactiveStreak: boolean;
}

export interface MentorDashboard {
  month: string;
  tingkat: number;
  rows: DashboardRow[];
  toRespond: number;
}

export interface HistoryItem {
  month: string;
  status: JournalStatus;
  pulse: Pulse;
  appreciation: string | null;
  responseText: string | null;
}

export interface JournalForMentor {
  journal: Journal;
  mentee: PersonSummary & {
    category: Category;
    tingkat: number;
    university: string;
    major: string;
    kipK: boolean | null;
  };
  previousTargets: string[] | null;
  history: HistoryItem[];
  canRespond: boolean;
  respondLockedReason: string | null;
}

export type ResponseDecision = "accepted" | "revision_requested" | "flagged";

export interface RespondInput {
  appreciation: string;
  text: string;
  decision: ResponseDecision;
  revisionRequest?: string;
  flagReason?: string;
}

// ---- Laporan mentoring ----

export type ReportStatus = "draft" | "submitted" | "returned" | "verified";

export interface ReportReview {
  appreciation: string;
  note: string;
  reviewerKind: "public" | "admin";
  reviewedBy: string;
  reviewedAt: string;
  readAt: string | null;
}

export interface SessionReport {
  id: number;
  mentorUserId: number;
  month: string;
  sessionDate: string | null;
  mode: "luring" | "daring";
  locationOrLink: string;
  curriculumCode: string;
  deviationReason: string | null;
  summary: string;
  photos: UploadedFile[];
  /** Null for koordinator: they only see `hasCase`. */
  caseNote: string | null;
  hasCase: boolean;
  caseStatus: "open" | "resolved" | null;
  status: ReportStatus;
  submittedAt: string | null;
  isLate: boolean;
  review: ReportReview | null;
  verifiedAt: string | null;
}

export interface CurriculumItem {
  code: string;
  tingkat: number;
  month: string;
  theme: string;
  goal: string;
  flow: string[];
  output: string;
  sheetUrl: string;
}

export interface MentorTasks {
  t1: boolean;
  t2: boolean;
  t3: boolean;
}

export interface ReportDetail {
  month: string;
  mentor: PersonSummary;
  coordinator: PersonSummary | null;
  report: SessionReport | null;
  curriculum: CurriculumItem;
  tasks: MentorTasks;
  canEdit: boolean;
  unrespondedJournals: number;
  canUnverify: boolean;
}

export interface SaveReportInput {
  sessionDate: string | null;
  mode: "luring" | "daring";
  locationOrLink: string;
  followsCurriculum: boolean;
  deviationReason: string | null;
  summary: string;
  photos: UploadedFile[];
  caseNote: string | null;
}

export interface ReportListItem {
  month: string;
  status: ReportStatus | "not_started";
  isLate: boolean;
  verifiedAt: string | null;
  reviewUnread: boolean;
}

// ---- Koordinator ----

export interface CoordinatorRow {
  mentor: PersonSummary;
  menteeCount: number;
  tingkat: number;
  report: {
    id: number;
    status: ReportStatus;
    isLate: boolean;
    submittedAt: string | null;
    verifiedAt: string | null;
    hasCase: boolean;
  } | null;
  journals: { submitted: number; responded: number; late: number };
  escalatedFlags: number;
  patternFlags: number;
  tasks: MentorTasks;
}

export interface CoordinatorOverview {
  month: string;
  rows: CoordinatorRow[];
}

export type ReviewDecision = "verify" | "return" | "unverify";

export interface ReviewInput {
  decision: ReviewDecision;
  appreciation: string;
  note: string;
}

// ---- Staf / pengelola ----

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface Indicator {
  key: string;
  label: string;
  numerator: number;
  denominator: number;
  target: number;
}

export interface CoordinatorRecap {
  coordinator: PersonSummary;
  mentors: number;
  mentees: number;
  submitted: number;
  late: number;
  responded: number;
  reportsSubmitted: number;
  reportsVerified: number;
  activeFlags: number;
}

export interface StaffDashboard {
  month: string;
  indicators: Indicator[];
  byCoordinator: CoordinatorRecap[];
  followupsOpen: number;
  withoutMentor: number;
}

export type FollowupSource = "journal" | "flag" | "report";

export interface FollowupItem {
  source: FollowupSource;
  id: number;
  month: string;
  subject: string;
  mentorName: string | null;
  coordinatorName: string | null;
  detail: string;
  openedAt: string;
  status: "open" | "handled";
  handled: Followup | null;
}

export interface ParticipantRow {
  userId: number;
  name: string;
  email: string;
  nim: string | null;
  roles: Role[];
  category: Category | null;
  kipK: boolean | null;
  university: string;
  tingkat: number;
  mentorName: string | null;
  coordinatorName: string | null;
  menteeCount: number;
  status: ParticipantStatus;
  hasAccount: boolean;
  clubOk: boolean;
}

export interface ParticipantDetail {
  row: ParticipantRow;
  participant: Participant;
  profile: Profile;
  mentees: PersonSummary[];
  mentors: PersonSummary[];
  journals: JournalListItem[];
}

export interface UpdateParticipantInput {
  isMentee: boolean;
  isMentor: boolean;
  isCoordinator: boolean;
  nim: string | null;
  kipK: boolean | null;
  category: Category | null;
  kaderisasiOverride: KaderisasiOverride | null;
  kaderisasiOverrideNote: string | null;
  coordinatorUserId: number | null;
}

/** A kaderisasi member found by the Super Admin search (`GET /perintis/members`). */
export interface MemberCandidate {
  userId: number;
  name: string;
  email: string | null;
  memberId: string | null;
  university: string | null;
  major: string | null;
  intakeYear: number | null;
  hasAccount: boolean;
  /** Already in the programme; `roles` lists what they hold. */
  participant: boolean;
  roles: Role[];
}

/** `POST /perintis/participants`: enrol a member with roles. */
export interface AddParticipantInput {
  userId: number;
  isMentee: boolean;
  isMentor: boolean;
  isCoordinator: boolean;
  nim: string | null;
  kipK: boolean | null;
  category: Category | null;
  mentorUserId: number | null;
  coordinatorUserId: number | null;
}

/** Permission for searching members and adding participants (Super Admin). */
export const ADD_PARTICIPANT_PERMISSION = "perintis.participants.add";

export type ImportKind = "mentee" | "mentor" | "matching";

export interface ImportPreviewRow {
  line: number;
  values: string[];
  result: "new" | "match" | "warning" | "error";
  message: string;
}

export interface ImportPreview {
  kind: ImportKind;
  columns: string[];
  rows: ImportPreviewRow[];
  canApply: boolean;
}

export type ExportKind =
  | "rekap-mentee"
  | "tugas-mentor"
  | "status-lapbul"
  | "laporan-mentoring"
  | "data-peserta";
