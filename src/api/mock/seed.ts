import type {
  Achievement,
  ActivityItem,
  KaderisasiProfile,
  Category,
  ClubItem,
  Followup,
  Journal,
  JournalAnswers,
  Participant,
  Profile,
  Pulse,
  SessionReport,
  StaffUser,
} from "@/api/types";

export type StoredReport = Omit<SessionReport, "hasCase"> & {
  followup: Followup | null;
};

export interface MockDb {
  version: number;
  profiles: Profile[];
  participants: Participant[];
  activities: Record<number, ActivityItem[]>;
  clubs: Record<number, ClubItem[]>;
  achievements: Record<number, Achievement[]>;
  journals: Journal[];
  reports: StoredReport[];
  staff: StaffUser[];
  seq: { journal: number; report: number; file: number; user: number };
  /** Full kaderisasi profiles edited by the pengelola (filled on first use). */
  kaderisasi?: Record<number, KaderisasiProfile>;
}

export const DB_VERSION = 2;

const NOV = "2026-11-01";
const DEC = "2026-12-01";

interface PersonSeed {
  id: number;
  name: string;
  gender: "L" | "P";
  university: string;
  major: string;
  intake: number;
  level?: Profile["level"];
}

const people: PersonSeed[] = [
  {
    id: 1,
    name: "Aisyah Rahmawati",
    gender: "P",
    university: "Institut Teknologi Bandung",
    major: "Teknik Kimia",
    intake: 2025,
    level: "Aktivis",
  },
  {
    id: 2,
    name: "Bima Saputra",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Matematika",
    intake: 2025,
  },
  {
    id: 3,
    name: "Citra Anindya",
    gender: "P",
    university: "Institut Teknologi Bandung",
    major: "Mikrobiologi",
    intake: 2025,
    level: "Aktivis",
  },
  {
    id: 4,
    name: "Dimas Hakim",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Fisika",
    intake: 2025,
  },
  {
    id: 5,
    name: "Eka Putri",
    gender: "P",
    university: "Institut Teknologi Bandung",
    major: "Teknik Sipil",
    intake: 2024,
    level: "Kader",
  },
  {
    id: 6,
    name: "Farhan Maulana",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Informatika",
    intake: 2024,
    level: "Kader",
  },
  {
    id: 7,
    name: "Gita Savitri",
    gender: "P",
    university: "Universitas Padjadjaran",
    major: "Farmasi",
    intake: 2024,
    level: "Aktivis",
  },
  {
    id: 8,
    name: "Hafiz Akbar",
    gender: "L",
    university: "Universitas Padjadjaran",
    major: "Ilmu Komunikasi",
    intake: 2024,
  },
  {
    id: 9,
    name: "Indah Permatasari",
    gender: "P",
    university: "Universitas Padjadjaran",
    major: "Kedokteran",
    intake: 2024,
    level: "Aktivis",
  },
  {
    id: 10,
    name: "Rani Oktavia",
    gender: "P",
    university: "Universitas Pendidikan Indonesia",
    major: "Pendidikan Biologi",
    intake: 2025,
  },
  {
    id: 11,
    name: "Joko Susilo",
    gender: "L",
    university: "Universitas Pendidikan Indonesia",
    major: "Pendidikan Matematika",
    intake: 2025,
  },
  {
    id: 12,
    name: "Kartika Sari",
    gender: "P",
    university: "Universitas Pendidikan Indonesia",
    major: "Psikologi",
    intake: 2025,
    level: "Aktivis",
  },
  {
    id: 13,
    name: "Lutfi Hakim",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Teknik Elektro",
    intake: 2025,
  },
  {
    id: 14,
    name: "Maya Anggraini",
    gender: "P",
    university: "Institut Teknologi Bandung",
    major: "Arsitektur",
    intake: 2025,
  },
  {
    id: 15,
    name: "Nadia Zahra",
    gender: "P",
    university: "Universitas Padjadjaran",
    major: "Agroteknologi",
    intake: 2025,
  },
  {
    id: 16,
    name: "Omar Fauzi",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Teknik Mesin",
    intake: 2024,
  },
  {
    id: 101,
    name: "Rizky Pratama",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Teknik Industri",
    intake: 2019,
    level: "Kader Lanjut",
  },
  {
    id: 102,
    name: "Laila Fitriani",
    gender: "P",
    university: "Institut Teknologi Bandung",
    major: "Biologi",
    intake: 2018,
    level: "Kader Lanjut",
  },
  {
    id: 103,
    name: "Yusuf Ramadhan",
    gender: "L",
    university: "Universitas Padjadjaran",
    major: "Hukum",
    intake: 2019,
    level: "Kader",
  },
  {
    id: 104,
    name: "Salsabila Putri",
    gender: "P",
    university: "Universitas Pendidikan Indonesia",
    major: "Bimbingan Konseling",
    intake: 2019,
    level: "Kader",
  },
  {
    id: 105,
    name: "Fajar Nugraha",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Teknik Geologi",
    intake: 2023,
    level: "Kader",
  },
  {
    id: 106,
    name: "Galih Permana",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Teknik Fisika",
    intake: 2018,
    level: "Kader Lanjut",
  },
  {
    id: 201,
    name: "Hana Lestari",
    gender: "P",
    university: "Institut Teknologi Bandung",
    major: "Planologi",
    intake: 2016,
    level: "Kader Lanjut",
  },
  {
    id: 202,
    name: "Arif Budiman",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Teknik Lingkungan",
    intake: 2015,
    level: "Kader Lanjut",
  }, // Kaderisasi members who are not in the programme yet (Super Admin search).
  {
    id: 301,
    name: "Nadia Kusuma",
    gender: "P",
    university: "Institut Teknologi Bandung",
    major: "Teknik Industri",
    intake: 2025,
  },
  {
    id: 302,
    name: "Umar Faruq",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Teknik Sipil",
    intake: 2017,
    level: "Kader Lanjut",
  },
  {
    id: 303,
    name: "Dewi Anggraeni",
    gender: "P",
    university: "Universitas Padjadjaran",
    major: "Farmasi",
    intake: 2025,
  },
  {
    id: 304,
    name: "Yoga Pratama",
    gender: "L",
    university: "Institut Teknologi Bandung",
    major: "Teknik Elektro",
    intake: 2020,
    level: "Kader",
  },
];

const slug = (name: string) => name.toLowerCase().split(" ").join(".");

function profileOf(p: PersonSeed): Profile {
  const level = p.level ?? "Jamaah";
  return {
    userId: p.id,
    name: p.name,
    email: `${slug(p.name)}@gmail.com`,
    gender: p.gender,
    phone: `0812-${String(1000 + p.id * 37).slice(-4)}-${String(2000 + p.id * 53).slice(-4)}`,
    instagram: p.id % 3 === 0 ? null : `@${slug(p.name).replace(".", "_")}`,
    linkedin:
      p.id > 100 ? `linkedin.com/in/${slug(p.name).replace(".", "-")}` : null,
    university: p.university,
    major: p.major,
    intakeYear: p.intake,
    domicile: p.university.includes("Padjadjaran") ? "Jatinangor" : "Bandung",
    level,
    sscStatus: level === "Jamaah" ? "Terdaftar SSC Online" : "Lulus SSC",
    lmdStatus:
      level === "Kader" || level === "Kader Lanjut" ? "Lulus LMD" : "Belum",
  };
}

type MenteeSeed = {
  id: number;
  mentor: number | null;
  category: Category;
  status?: Participant["status"];
  reason?: string;
  hasAccount?: boolean;
};

const mentees: MenteeSeed[] = [
  { id: 1, mentor: 101, category: "biaya_hidup" },
  { id: 2, mentor: 101, category: "dasar" },
  { id: 3, mentor: 101, category: "dasar" },
  { id: 4, mentor: 101, category: "biaya_hidup", hasAccount: false },
  { id: 5, mentor: 102, category: "biaya_hidup" },
  { id: 6, mentor: 102, category: "dasar" },
  { id: 105, mentor: 102, category: "dasar" },
  { id: 7, mentor: 103, category: "dasar" },
  { id: 8, mentor: 103, category: "biaya_hidup" },
  { id: 9, mentor: 103, category: "dasar" },
  { id: 10, mentor: 104, category: "biaya_hidup" },
  { id: 11, mentor: 104, category: "dasar" },
  { id: 12, mentor: 104, category: "dasar" },
  { id: 13, mentor: 105, category: "dasar" },
  { id: 14, mentor: 105, category: "biaya_hidup" },
  {
    id: 15,
    mentor: null,
    category: "dasar",
    hasAccount: false,
  },
  {
    id: 16,
    mentor: 102,
    category: "dasar",
    status: "inactive",
    reason: "Mengundurkan diri dari beasiswa (surat 2 Des 2026)",
  },
];

const mentorCoordinator: Record<number, number | null> = {
  101: 201,
  102: 201,
  103: 201,
  104: 202,
  105: 202,
  106: null,
};

function participants(): Participant[] {
  const rows = new Map<number, Participant>();
  const base = (id: number): Participant => ({
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
    hasAccount: true,
  });
  for (const m of mentees) {
    const p = rows.get(m.id) ?? base(m.id);
    const person = people.find((x) => x.id === m.id)!;
    p.isMentee = true;
    p.nim = person.university.includes("Bandung")
      ? `${person.major.length % 2 ? "165" : "105"}${String(person.intake).slice(-2)}${String(100 + m.id * 7).slice(-3)}`
      : `1402102${person.intake % 100}0${String(40 + m.id).padStart(3, "0")}`;
    p.kipK = m.category === "biaya_hidup" || m.id % 2 === 0;
    p.category = m.category;
    p.mentorUserId = m.mentor;
    p.status = m.status ?? "active";
    p.inactiveReason = m.reason ?? null;
    p.hasAccount = m.hasAccount ?? true;
    if (m.id === 7) {
      p.kaderisasiOverride = "setara";
      p.kaderisasiOverrideNote =
        "Bukti kegiatan setara diperiksa PIC kaderisasi, 20 Okt 2026";
    }
    rows.set(m.id, p);
  }
  for (const [id, coord] of Object.entries(mentorCoordinator)) {
    const p = rows.get(Number(id)) ?? base(Number(id));
    p.isMentor = true;
    p.coordinatorUserId = coord;
    rows.set(Number(id), p);
  }
  for (const id of [201, 202]) {
    const p = rows.get(id) ?? base(id);
    p.isCoordinator = true;
    rows.set(id, p);
  }
  return [...rows.values()];
}

function activitiesFor(id: number): ActivityItem[] {
  const list: ActivityItem[] = [
    {
      name: "Kick-off Pembinaan & Sesi 0",
      category: "Kaderisasi",
      date: "2026-10-31",
      status: "Lulus",
      certificate: false,
    },
    {
      name: "Kajian Ahad Pagi Salman",
      category: "Kaderisasi",
      date: "2026-11-15",
      status: "Lulus",
      certificate: false,
    },
  ];
  if (id % 2 === 1)
    list.push({
      name: "Ekskursi Sociopreneur Club — Kampung Ilmu",
      category: "Aktualisasi Diri",
      date: "2026-11-07",
      status: "Lulus",
      certificate: true,
    });
  if (id % 3 !== 0)
    list.push({
      name: "Kelas Bahasa Inggris BMKA (daring)",
      category: "Pelatihan",
      date: "2026-10-12",
      status: "Terdaftar",
      certificate: false,
    });
  if (id < 100 && id % 4 === 1)
    list.push({
      name: "Spectra 2025",
      category: "Kaderisasi",
      date: "2025-09-20",
      status: "Lulus",
      certificate: true,
    });
  if (id > 100)
    list.push({
      name: "Pelatihan Mentor Perintis",
      category: "Kaderisasi",
      date: "2026-10-18",
      status: "Lulus",
      certificate: true,
    });
  return list;
}

const CLUBS = [
  "Sociopreneur Club",
  "Salman Media",
  "Karisma Salman",
  "Unit Bahasa Arab",
  "Salman Robotic Club",
];

function clubsFor(id: number): ClubItem[] {
  if (id === 4 || id === 11) return [];
  return [
    {
      name: CLUBS[id % CLUBS.length],
      role: id === 1 ? "Staf Acara" : "Anggota",
      status: "Diterima",
    },
  ];
}

function achievementsFor(id: number): Achievement[] {
  if (id === 1)
    return [
      {
        name: "Juara 2 Lomba Esai Energi Terbarukan",
        level: "Nasional",
        year: 2026,
        status: "Disetujui",
      },
      {
        name: "Finalis Business Case ITB",
        level: "Kampus",
        year: 2026,
        status: "Menunggu verifikasi",
      },
    ];
  if (id % 4 === 2)
    return [
      {
        name: "Asisten Praktikum Kalkulus",
        level: "Kampus",
        year: 2026,
        status: "Disetujui",
      },
    ];
  return [];
}

// ---- journals ----

const pulse = (
  energy: number,
  academic: number,
  finance: number,
  relation: number,
): Pulse => ({ energy, academic, finance, relation });

function answers(
  id: number,
  month: string,
  category: Category,
  extra: Partial<JournalAnswers> = {},
): JournalAnswers {
  const nov = month === NOV;
  const base: JournalAnswers = {
    s1b: nov
      ? "Bulan pertama ikut pembinaan, banyak penyesuaian dengan jadwal kuliah."
      : "Minggu UAS berat, tapi rencana belajar dari sesi kemarin cukup menolong.",
    s1c:
      id % 2
        ? "Keluarga sehat, Ibu mulai berjualan lagi di rumah."
        : "Alhamdulillah keluarga baik.",
    s1d: "",
    s2a: nov ? undefined : ["tercapai", "sebagian", "belum"],
    s2b: nov
      ? "Sesi kelompok membantu saya menyusun jadwal."
      : "Jadwal belajar 4 pekan sangat membantu, yang menghambat tugas besar menumpuk di akhir.",
    targets: nov
      ? [
          "Jika selesai kuliah pagi, maka saya membaca ulang catatan 20 menit di perpustakaan.",
          "Jika azan Subuh, maka saya tilawah minimal 2 halaman.",
          "Jika hari Ahad, maka saya menyusun rencana pekan depan.",
        ]
      : [
          "Jika SSC Online dibuka tiap pagi, maka saya menyelesaikan satu modul sebelum kuliah.",
          "Jika ada tugas besar, maka saya memecahnya jadi target harian di kalender.",
          "Jika merasa lelah, maka saya tidur sebelum pukul 22.30.",
        ],
    s3a: nov
      ? "Saya baru sadar banyak waktu habis di perjalanan.\nSekarang saya pakai untuk mendengar kajian."
      : "Di sesi Desember saya belajar memilah tugas penting dan mendesak.\nSaya jadi tidak panik saat UAS.",
    s5aPages: 60 + id * 3,
    s5aVerse:
      "QS Al-Insyirah 5–6. Mengingatkan bahwa setiap kesulitan ada kemudahan.",
    s5b: "Shalat dhuha sebelum kuliah pagi",
    s5cKinds: ["Tenaga"],
    s5cText: "Membantu adik tingkat belajar kalkulus.",
    s5d: id % 3 === 0 ? null : 8 + id,
    s6: "Nadia (Unpad). Dia mengatur uang bulanan dengan amplop per pekan.",
  };
  if (category === "biaya_hidup")
    Object.assign(base, {
      s8aChanged: false,
      s8aText: "",
      s8b: ["Makan", "Transportasi"],
    });
  return { ...base, ...extra };
}

let journalId = 0;

function journal(
  menteeId: number,
  month: string,
  category: Category,
  mentorId: number | null,
  partial: Partial<Journal>,
): Journal {
  journalId += 1;
  return {
    id: journalId,
    menteeUserId: menteeId,
    month,
    mentorUserId: mentorId,
    category,
    formVersion: 1,
    status: "draft",
    answers: answers(menteeId, month, category),
    files: [],
    pulse: pulse(4, 3, 3, 4),
    wantsContact: false,
    honestyConfirmedAt: null,
    submittedAt: null,
    isLate: false,
    revision: 1,
    reopenReason: null,
    response: null,
    flag: null,
    followup: null,
    updatedAt: "2027-01-01T08:00:00+07:00",
    ...partial,
  };
}

const MENTOR_NAME: Record<number, string> = {
  101: "Rizky Pratama",
  102: "Laila Fitriani",
  103: "Yusuf Ramadhan",
  104: "Salsabila Putri",
  105: "Fajar Nugraha",
};

function novJournals(): Journal[] {
  const list: Journal[] = [];
  for (const m of mentees) {
    if (!m.mentor || m.status) continue;
    const day = 2 + (m.id % 4);
    list.push(
      journal(m.id, NOV, m.category, m.mentor, {
        status: "accepted",
        honestyConfirmedAt: `2026-12-0${day}T19:00:00+07:00`,
        submittedAt: `2026-12-0${day}T20:15:00+07:00`,
        isLate: m.id === 4,
        pulse: pulse(4, 3, m.category === "biaya_hidup" ? 3 : 4, 4),
        response: {
          appreciation:
            m.id === 1
              ? "Terima kasih Aisyah, refleksimu soal waktu perjalanan sangat jujur dan konkret."
              : "Terima kasih sudah mengisi dengan jujur dan tepat waktu.",
          text:
            m.id === 1
              ? "Target tilawah setelah Subuh bagus. Coba pasangkan dengan pengingat di ponsel supaya konsisten.\nBulan depan kita bahas rencana belajar UAS."
              : "Target bulan depan sudah spesifik. Pertahankan, dan ceritakan hasilnya di sesi.",
          revisionRequest: null,
          flagReason: null,
          respondedBy: MENTOR_NAME[m.mentor],
          respondedAt: `2026-12-${String(day + 5).padStart(2, "0")}T21:00:00+07:00`,
          readAt:
            m.id === 1
              ? null
              : `2026-12-${String(day + 6).padStart(2, "0")}T07:00:00+07:00`,
        },
        updatedAt: `2026-12-${String(day + 5).padStart(2, "0")}T21:00:00+07:00`,
      }),
    );
  }
  return list;
}

function decJournals(): Journal[] {
  const submitted = (day: string) => ({
    honestyConfirmedAt: `2027-01-${day}T19:30:00+07:00`,
    submittedAt: `2027-01-${day}T20:10:00+07:00`,
    updatedAt: `2027-01-${day}T20:10:00+07:00`,
  });
  const accepted = (mentorId: number, day: string) => ({
    status: "accepted" as const,
    response: {
      appreciation: "Terima kasih, refleksimu jujur dan rapi.",
      text: "Targetmu bulan ini realistis. Semangat menuntaskan UAS!",
      revisionRequest: null,
      flagReason: null,
      respondedBy: MENTOR_NAME[mentorId],
      respondedAt: `2027-01-${day}T21:00:00+07:00`,
      readAt: null,
    },
  });
  return [
    journal(1, DEC, "biaya_hidup", 101, {
      status: "draft",
      honestyConfirmedAt: "2027-01-03T20:00:00+07:00",
      answers: answers(1, DEC, "biaya_hidup", {
        s3a: "",
        s5aVerse: "",
        s6: "",
        s8b: [],
      }),
      updatedAt: "2027-01-03T20:30:00+07:00",
    }),
    journal(2, DEC, "dasar", 101, {
      status: "submitted",
      ...submitted("02"),
      pulse: pulse(2, 3, 1, 3),
      wantsContact: true,
      answers: answers(2, DEC, "dasar", {
        s1b: "Bulan ini berat, uang kiriman belum datang dan saya sering melewatkan makan.",
        s1d: "Belum bisa bayar kos bulan Januari.\nSaya malu cerita ke teman.",
      }),
      flag: {
        trigger: "both",
        status: "open",
        dueAt: "2027-01-05T20:10:00+07:00",
        handledBy: null,
        handledAt: null,
        privateNote: null,
      },
    }),
    journal(3, DEC, "dasar", 101, { status: "submitted", ...submitted("03") }),
    journal(5, DEC, "biaya_hidup", 102, {
      status: "flagged",
      ...submitted("01"),
      pulse: pulse(3, 3, 2, 3),
      answers: answers(5, DEC, "biaya_hidup", {
        s8aChanged: true,
        s8aText:
          "Ayah kehilangan pekerjaan bulan ini.\nAdik juga butuh biaya sekolah.",
      }),
      response: {
        appreciation: "Terima kasih Eka sudah berani bercerita.",
        text: "Saya teruskan ke pengelola supaya ada yang membantu mencari jalan keluar.",
        revisionRequest: null,
        flagReason:
          "Kondisi ekonomi keluarga memburuk (ayah kehilangan pekerjaan). Perlu dicek kemungkinan bantuan darurat.",
        respondedBy: "Laila Fitriani",
        respondedAt: "2027-01-03T08:00:00+07:00",
        readAt: "2027-01-03T12:00:00+07:00",
      },
    }),
    journal(6, DEC, "dasar", 102, {
      ...submitted("02"),
      ...accepted(102, "03"),
    }),
    journal(7, DEC, "dasar", 103, { status: "submitted", ...submitted("02") }),
    journal(8, DEC, "biaya_hidup", 103, {
      ...submitted("01"),
      ...accepted(103, "02"),
    }),
    journal(9, DEC, "dasar", 103, {
      ...submitted("02"),
      ...accepted(103, "03"),
    }),
    journal(10, DEC, "biaya_hidup", 104, {
      status: "submitted",
      honestyConfirmedAt: "2027-01-01T07:30:00+07:00",
      submittedAt: "2027-01-01T08:00:00+07:00",
      updatedAt: "2027-01-01T08:00:00+07:00",
      pulse: pulse(2, 2, 1, 3),
      flag: {
        trigger: "low_pulse",
        status: "open",
        dueAt: "2027-01-04T08:00:00+07:00",
        handledBy: null,
        handledAt: null,
        privateNote: null,
      },
    }),
    journal(11, DEC, "dasar", 104, {
      ...submitted("02"),
      ...accepted(104, "03"),
    }),
    journal(12, DEC, "dasar", 104, {
      status: "revision_requested",
      ...submitted("01"),
      response: {
        appreciation:
          "Insight-mu soal mengelola emosi saat ujian bagus sekali.",
        text: "Ada satu hal yang perlu diperbaiki sebelum saya terima.",
        revisionRequest:
          "Target 2c masih terlalu umum. Tulis ulang ketiganya dengan pola “Jika … maka saya …” yang bisa dicek.",
        flagReason: null,
        respondedBy: "Salsabila Putri",
        respondedAt: "2027-01-03T19:00:00+07:00",
        readAt: null,
      },
      answers: answers(12, DEC, "dasar", {
        targets: ["Belajar lebih rajin", "Lebih banyak ibadah", "Olahraga"],
      }),
    }),
    journal(13, DEC, "dasar", 105, { status: "submitted", ...submitted("02") }),
    journal(14, DEC, "biaya_hidup", 105, {
      status: "draft",
      honestyConfirmedAt: "2027-01-02T21:00:00+07:00",
      answers: { s1b: "Bulan ini cukup baik." },
      pulse: pulse(4, 3, 3, 4),
    }),
  ];
}

function reports(): StoredReport[] {
  let id = 0;
  const make = (
    mentorId: number,
    month: string,
    partial: Partial<StoredReport>,
  ): StoredReport => {
    id += 1;
    const isNov = month === NOV;
    return {
      id,
      mentorUserId: mentorId,
      month,
      sessionDate: isNov ? "2026-11-14" : "2026-12-13",
      mode: "luring",
      locationOrLink: "Selasar Masjid Salman ITB",
      curriculumCode: isNov ? "T2-11" : "T2-12",
      deviationReason: null,
      summary: isNov
        ? "Sesi dibuka dengan kabar masing-masing. Mentee menyusun kalender pekan berjalan.\nSemua hadir dan aktif."
        : "Sesi membahas peran organisasi. Mentee memetakan beban dan batas sehat masing-masing.",
      photos: [
        {
          key: `mock/report-${mentorId}-${month}.jpg`,
          name: "foto-kelompok.jpg",
          mime: "image/jpeg",
          size: 182_000,
          previewUrl: null,
        },
      ],
      caseNote: null,
      caseStatus: null,
      status: "verified",
      submittedAt: isNov ? "2026-12-08T20:00:00+07:00" : null,
      isLate: false,
      review: isNov
        ? {
            appreciation: "Laporan rapi dan foto jelas. Terima kasih.",
            note: "Pertahankan pembukaan kabar di awal sesi.",
            reviewerKind: "public",
            reviewedBy:
              mentorCoordinator[mentorId] === 201
                ? "Hana Lestari"
                : "Arif Budiman",
            reviewedAt: "2026-12-14T19:00:00+07:00",
            readAt: "2026-12-15T07:00:00+07:00",
          }
        : null,
      verifiedAt: isNov ? "2026-12-14T19:00:00+07:00" : null,
      followup: null,
      ...partial,
    };
  };
  return [
    ...[101, 102, 103, 104, 105].map((m) => make(m, NOV, {})),
    make(102, DEC, {
      status: "submitted",
      submittedAt: "2027-01-03T16:00:00+07:00",
      curriculumCode: "T3-12",
    }),
    make(103, DEC, {
      status: "submitted",
      submittedAt: "2027-01-02T21:00:00+07:00",
      locationOrLink: "Masjid Unpad Jatinangor",
      curriculumCode: "T3-12",
      caseNote:
        "Dua mentee meminta pindah jadwal sesi karena praktikum Sabtu. Perlu keputusan apakah kelompok pindah ke Ahad.",
      caseStatus: "open",
    }),
    make(104, DEC, {
      status: "draft",
      sessionDate: "2026-12-12",
      photos: [],
      summary: "",
    }),
    make(105, DEC, {
      status: "returned",
      submittedAt: "2027-01-02T09:00:00+07:00",
      mode: "daring",
      locationOrLink: "https://meet.google.com/abc-defg-hij",
      curriculumCode: "T2-12",
      review: {
        appreciation: "Terima kasih sudah mengajukan lebih awal.",
        note: "Tangkapan layar belum menunjukkan peserta. Unggah ulang yang memperlihatkan semua mentee.",
        reviewerKind: "public",
        reviewedBy: "Arif Budiman",
        reviewedAt: "2027-01-03T10:00:00+07:00",
        readAt: null,
      },
    }),
  ];
}

export function createSeed(): MockDb {
  journalId = 0;
  const journals = [...novJournals(), ...decJournals()];
  const reportRows = reports();
  const ids = people.map((p) => p.id);
  return {
    version: DB_VERSION,
    profiles: people.map(profileOf),
    participants: participants(),
    activities: Object.fromEntries(ids.map((id) => [id, activitiesFor(id)])),
    clubs: Object.fromEntries(ids.map((id) => [id, clubsFor(id)])),
    achievements: Object.fromEntries(
      ids.map((id) => [id, achievementsFor(id)]),
    ),
    journals,
    reports: reportRows,
    staff: [
      {
        id: 1,
        name: "Pengelola BMKA",
        email: "pengelola@salmanitb.com",
        roles: ["Pengelola Perintis"],
        permissions: [
          "perintis.participants.read",
          "perintis.participants.manage",
          "perintis.content.read",
          "perintis.followups.manage",
          "perintis.recap.read",
          "perintis.recap.export",
        ],
      },
      {
        id: 2,
        name: "Super Admin",
        email: "superadmin@salmanitb.com",
        roles: ["Super Admin"],
        permissions: [
          "perintis.participants.read",
          "perintis.participants.manage",
          "perintis.participants.add",
          "perintis.content.read",
          "perintis.followups.manage",
          "perintis.recap.read",
          "perintis.recap.export",
        ],
      },
    ],
    seq: {
      journal: journals.length,
      report: reportRows.length,
      file: 0,
      user: 1000,
    },
  };
}
