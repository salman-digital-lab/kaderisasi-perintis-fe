import {
  ActionIcon,
  Alert,
  Autocomplete,
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { catalogApi, staffApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import type {
  Degree,
  EducationEntry,
  KaderisasiProfile,
  KaderisasiProfileInput,
  WorkEntry,
} from "@/api/types";
import { Screen } from "@/components/layout/Screen";
import { EmptyState, KeyValue, Loadable, Section } from "@/components/ui";
import { fmtDate, tz } from "@/lib/time";

const GENDER_LABEL: Record<"M" | "F", string> = {
  M: "Laki-laki",
  F: "Perempuan",
};

const LEVEL_OPTIONS = [
  { value: "0", label: "Jamaah" },
  { value: "3", label: "Aktivis" },
  { value: "6", label: "Kader" },
  { value: "10", label: "Kader Lanjut" },
];

const DEGREE_LABEL: Record<Degree, string> = {
  high_school: "SMA/SMK",
  diploma: "D3",
  bachelor: "S1",
  master: "S2",
  doctoral: "S3",
};

export const MANAGE_PERMISSION = "perintis.participants.manage";

const profileKey = (id: number) => ["staff", "participant-profile", id];

function useProvinces() {
  return useQuery({
    queryKey: ["catalog", "provinces"],
    queryFn: catalogApi.provinces,
    staleTime: Infinity,
  });
}

function useCities(provinceId: number | null) {
  return useQuery({
    queryKey: ["catalog", "cities", provinceId],
    queryFn: () => catalogApi.cities(provinceId!),
    enabled: !!provinceId,
    staleTime: Infinity,
  });
}

const birthDate = (value: string | null) =>
  value ? tz(value).format("YYYY-MM-DD") : "";

const levelLabel = (level: number | null) =>
  LEVEL_OPTIONS.find((o) => o.value === String(level ?? 0))?.label ?? "—";

const educationLine = (e: EducationEntry) =>
  [
    e.degree && DEGREE_LABEL[e.degree],
    [e.institution, e.faculty, e.major].filter(Boolean).join(", "),
    e.intake_year && `angkatan ${e.intake_year}`,
  ]
    .filter(Boolean)
    .join(" · ");

const workLine = (w: WorkEntry) =>
  [
    [w.job_title, w.company].filter(Boolean).join(" di "),
    w.start_year && `${w.start_year}–${w.end_year ?? "sekarang"}`,
  ]
    .filter(Boolean)
    .join(" · ");

function SubTitle({ children }: { children: ReactNode }) {
  return (
    <Text size="xs" fw={700} c="dimmed" tt="uppercase" mt="md" mb={4}>
      {children}
    </Text>
  );
}

function ReadProfile({ p }: { p: KaderisasiProfile }) {
  const provinces = useProvinces();
  const originCities = useCities(p.origin_province_id);
  const provinceName = (id: number | null) =>
    provinces.data?.find((x) => x.id === id)?.name ?? null;
  const originCity =
    originCities.data?.find((x) => x.id === p.origin_city_id)?.name ?? null;
  return (
    <>
      <SubTitle>Data diri</SubTitle>
      <KeyValue
        items={[
          ["Nama lengkap", p.name],
          ["Jenis kelamin", p.gender && GENDER_LABEL[p.gender]],
          ["Tanggal lahir", p.birth_date && fmtDate(tz(p.birth_date))],
          ["Nomor identitas", p.personal_id],
          ["Jenjang", levelLabel(p.level)],
          ["Lencana", p.badges.length ? p.badges.join(", ") : null],
        ]}
      />
      <SubTitle>Domisili & asal</SubTitle>
      <KeyValue
        items={[
          [
            "Domisili",
            [p.city?.name, p.province?.name].filter(Boolean).join(", ") || null,
          ],
          ["Negara", p.country],
          [
            "Asal",
            [originCity, provinceName(p.origin_province_id)]
              .filter(Boolean)
              .join(", ") || null,
          ],
        ]}
      />
      <SubTitle>Pendidikan</SubTitle>
      {p.education_history.length ? (
        <Stack gap={4}>
          {p.education_history.map((e, i) => (
            <Text key={i} size="sm">
              {educationLine(e) || "—"}
            </Text>
          ))}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          Belum diisi.
        </Text>
      )}
      <SubTitle>Pekerjaan</SubTitle>
      {p.work_history.length ? (
        <Stack gap={4}>
          {p.work_history.map((w, i) => (
            <Text key={i} size="sm">
              {workLine(w) || "—"}
            </Text>
          ))}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          Belum diisi.
        </Text>
      )}
      <SubTitle>Kontak</SubTitle>
      <KeyValue
        items={[
          ["WhatsApp", p.whatsapp],
          ["Instagram", p.instagram],
          ["ID Line", p.line],
          ["TikTok", p.tiktok],
          ["LinkedIn", p.linkedin],
        ]}
      />
    </>
  );
}

/** The participant's full kaderisasi profile on the pengelola detail page. */
export function ProfileSection({
  userId,
  canEdit,
}: {
  userId: number;
  canEdit: boolean;
}) {
  const query = useQuery({
    queryKey: profileKey(userId),
    queryFn: () => staffApi.participantProfile(userId),
  });
  return (
    <Section
      title="Profil kaderisasi"
      description="Data anggota di website kaderisasi. Perubahan di sini juga tampil di sana."
      action={
        canEdit &&
        query.data?.profile && (
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPencil size={14} />}
            component={Link}
            to={`/kelola/peserta/${userId}/profil`}
          >
            Ubah profil
          </Button>
        )
      }
    >
      <Loadable query={query}>
        {(d) =>
          d.profile ? (
            <ReadProfile p={d.profile} />
          ) : (
            <EmptyState
              title="Belum punya profil kaderisasi"
              description="Profil dibuat saat anggota melengkapinya di website kaderisasi."
            />
          )
        }
      </Loadable>
    </Section>
  );
}

// ---- edit page ----------------------------------------------------------------

interface FormState {
  name: string;
  gender: "M" | "F" | null;
  personal_id: string;
  birth_date: string;
  level: string;
  badges: string[];
  province_id: number | null;
  city_id: number | null;
  country: string;
  origin_province_id: number | null;
  origin_city_id: number | null;
  whatsapp: string;
  instagram: string;
  line: string;
  tiktok: string;
  linkedin: string;
  education: (Omit<EducationEntry, "intake_year"> & { intake_year: string })[];
  work: (Omit<WorkEntry, "start_year" | "end_year"> & {
    start_year: string;
    end_year: string;
  })[];
}

const toForm = (p: KaderisasiProfile): FormState => ({
  name: p.name ?? "",
  gender: p.gender,
  personal_id: p.personal_id ?? "",
  birth_date: birthDate(p.birth_date),
  level: String(p.level ?? 0),
  badges: p.badges,
  province_id: p.province_id,
  city_id: p.city_id,
  country: p.country ?? "",
  origin_province_id: p.origin_province_id,
  origin_city_id: p.origin_city_id,
  whatsapp: p.whatsapp ?? "",
  instagram: p.instagram ?? "",
  line: p.line ?? "",
  tiktok: p.tiktok ?? "",
  linkedin: p.linkedin ?? "",
  education: p.education_history.map((e) => ({
    ...e,
    intake_year: e.intake_year ? String(e.intake_year) : "",
  })),
  work: p.work_history.map((w) => ({
    ...w,
    start_year: w.start_year ? String(w.start_year) : "",
    end_year: w.end_year ? String(w.end_year) : "",
  })),
});

const year = (v: string) => (/^\d{4}$/.test(v.trim()) ? Number(v) : undefined);

const toInput = (f: FormState): KaderisasiProfileInput => ({
  name: f.name.trim(),
  gender: f.gender ?? undefined,
  personal_id: f.personal_id.trim(),
  birth_date: f.birth_date || undefined,
  level: Number(f.level),
  badges: f.badges,
  province_id: f.province_id ?? undefined,
  city_id: f.city_id ?? undefined,
  country: f.country.trim() || undefined,
  origin_province_id: f.origin_province_id ?? undefined,
  origin_city_id: f.origin_city_id ?? undefined,
  whatsapp: f.whatsapp.trim(),
  instagram: f.instagram.trim(),
  line: f.line.trim(),
  tiktok: f.tiktok.trim(),
  linkedin: f.linkedin.trim(),
  education_history: f.education
    .map((e) => ({
      ...(e.degree ? { degree: e.degree } : {}),
      institution: e.institution.trim(),
      faculty: e.faculty.trim(),
      major: e.major.trim(),
      intake_year: year(e.intake_year),
    }))
    .filter((e) => e.institution || e.faculty || e.major || e.intake_year),
  work_history: f.work
    .map((w) => ({
      job_title: w.job_title.trim(),
      company: w.company.trim(),
      start_year: year(w.start_year),
      end_year: year(w.end_year),
    }))
    .filter((w) => w.job_title || w.company || w.start_year || w.end_year),
});

/** Searchable university names; free text is allowed, as on the member site. */
function InstitutionInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [search] = useDebouncedValue(value.trim(), 300);
  const options = useQuery({
    queryKey: ["catalog", "universities", search],
    queryFn: () => catalogApi.universities(search),
    enabled: search.length >= 2,
    staleTime: 60_000,
  });
  return (
    <Autocomplete
      label="Kampus / institusi"
      value={value}
      onChange={onChange}
      data={[...new Set((options.data ?? []).map((u) => u.name))]}
    />
  );
}

function PlaceSelects({
  label,
  provinceId,
  cityId,
  onChange,
}: {
  label: string;
  provinceId: number | null;
  cityId: number | null;
  onChange: (provinceId: number | null, cityId: number | null) => void;
}) {
  const provinces = useProvinces();
  const cities = useCities(provinceId);
  return (
    <>
      <Select
        label={`Provinsi ${label}`}
        searchable
        data={(provinces.data ?? []).map((p) => ({
          value: String(p.id),
          label: p.name,
        }))}
        value={provinceId ? String(provinceId) : null}
        onChange={(v) => onChange(v ? Number(v) : null, null)}
      />
      <Select
        label={`Kota / kabupaten ${label}`}
        searchable
        disabled={!provinceId}
        data={(cities.data ?? []).map((c) => ({
          value: String(c.id),
          label: c.name,
        }))}
        value={cityId ? String(cityId) : null}
        onChange={(v) => onChange(provinceId, v ? Number(v) : null)}
      />
    </>
  );
}

function EditForm({
  userId,
  profile,
}: {
  userId: number;
  profile: KaderisasiProfile;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toForm(profile));
  // Opened from the bottom of the detail page; start at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  const set = (patch: Partial<FormState>) =>
    setForm((f) => ({ ...f, ...patch }));
  const countries = useQuery({
    queryKey: ["catalog", "countries"],
    queryFn: catalogApi.countries,
    staleTime: Infinity,
  });
  const back = `/kelola/peserta/${userId}`;
  const save = useMutation({
    mutationFn: () => staffApi.updateParticipantProfile(userId, toInput(form)),
    onSuccess: (next) => {
      queryClient.setQueryData(profileKey(userId), next);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      notifications.show({ color: "teal", message: "Profil tersimpan." });
      navigate(back);
    },
  });
  const setEducation = (i: number, patch: Partial<FormState["education"][0]>) =>
    set({
      education: form.education.map((e, j) =>
        j === i ? { ...e, ...patch } : e,
      ),
    });
  const setWork = (i: number, patch: Partial<FormState["work"][0]>) =>
    set({ work: form.work.map((w, j) => (j === i ? { ...w, ...patch } : w)) });
  const badYear = (v: string) =>
    v.trim() && !year(v) ? "Tulis 4 angka, mis. 2024." : undefined;

  return (
    <Screen
      title="Ubah profil"
      subtitle={profile.name}
      back={back}
      width="wide"
      footer={
        <Group justify="flex-end" gap="sm" w="100%">
          <Button variant="default" component={Link} to={back}>
            Batal
          </Button>
          <Button
            loading={save.isPending}
            disabled={!form.name.trim()}
            onClick={() => save.mutate()}
          >
            Simpan
          </Button>
        </Group>
      }
    >
      <Stack gap="lg">
        {save.isError && <Alert color="red">{errorMessage(save.error)}</Alert>}
        <Paper p="lg">
          <Title order={3} mb="md">
            Data diri
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Nama lengkap"
              required
              value={form.name}
              onChange={(e) => set({ name: e.currentTarget.value })}
            />
            <Select
              label="Jenis kelamin"
              data={[
                { value: "M", label: "Laki-laki" },
                { value: "F", label: "Perempuan" },
              ]}
              value={form.gender}
              onChange={(v) => set({ gender: v as "M" | "F" | null })}
            />
            <TextInput
              label="Tanggal lahir"
              type="date"
              value={form.birth_date}
              onChange={(e) => set({ birth_date: e.currentTarget.value })}
            />
            <TextInput
              label="Nomor identitas"
              value={form.personal_id}
              onChange={(e) => set({ personal_id: e.currentTarget.value })}
            />
            <Select
              label="Jenjang"
              data={LEVEL_OPTIONS}
              value={form.level}
              onChange={(v) => set({ level: v ?? "0" })}
            />
            <TagsInput
              label="Lencana"
              description="Tekan Enter setelah tiap lencana."
              value={form.badges}
              onChange={(v) => set({ badges: v })}
            />
          </SimpleGrid>
        </Paper>
        <Paper p="lg">
          <Title order={3} mb="md">
            Domisili & asal
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <PlaceSelects
              label="domisili"
              provinceId={form.province_id}
              cityId={form.city_id}
              onChange={(province_id, city_id) => set({ province_id, city_id })}
            />
            <Select
              label="Negara"
              searchable
              data={[...new Set((countries.data ?? []).map((c) => c.name))].map(
                (name) => ({ value: name, label: name }),
              )}
              value={form.country || null}
              onChange={(v) => set({ country: v ?? "" })}
            />
            <div />
            <PlaceSelects
              label="asal"
              provinceId={form.origin_province_id}
              cityId={form.origin_city_id}
              onChange={(origin_province_id, origin_city_id) =>
                set({ origin_province_id, origin_city_id })
              }
            />
          </SimpleGrid>
        </Paper>
        <Paper p="lg">
          <Title order={3}>Pendidikan</Title>
          <Text size="xs" c="dimmed" mb="md">
            Entri terakhir dipakai sebagai kampus, prodi, dan angkatan di
            Perintis (menentukan tingkat).
          </Text>
          <Stack gap="lg">
            {form.education.map((e, i) => (
              <Paper key={i} withBorder p="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={700}>
                    Pendidikan {i + 1}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Hapus pendidikan ${i + 1}`}
                    onClick={() =>
                      set({
                        education: form.education.filter((_, j) => j !== i),
                      })
                    }
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Select
                    label="Jenjang"
                    clearable
                    data={Object.entries(DEGREE_LABEL).map(
                      ([value, label]) => ({
                        value,
                        label,
                      }),
                    )}
                    value={e.degree ?? null}
                    onChange={(v) =>
                      setEducation(i, { degree: (v as Degree) ?? undefined })
                    }
                  />
                  <InstitutionInput
                    value={e.institution}
                    onChange={(v) => setEducation(i, { institution: v })}
                  />
                  <TextInput
                    label="Fakultas"
                    value={e.faculty}
                    onChange={(ev) =>
                      setEducation(i, { faculty: ev.currentTarget.value })
                    }
                  />
                  <TextInput
                    label="Program studi"
                    value={e.major}
                    onChange={(ev) =>
                      setEducation(i, { major: ev.currentTarget.value })
                    }
                  />
                  <TextInput
                    label="Tahun masuk"
                    inputMode="numeric"
                    value={e.intake_year}
                    error={badYear(e.intake_year)}
                    onChange={(ev) =>
                      setEducation(i, { intake_year: ev.currentTarget.value })
                    }
                  />
                </SimpleGrid>
              </Paper>
            ))}
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() =>
                set({
                  education: [
                    ...form.education,
                    {
                      institution: "",
                      faculty: "",
                      major: "",
                      intake_year: "",
                    },
                  ],
                })
              }
            >
              Tambah pendidikan
            </Button>
          </Stack>
        </Paper>
        <Paper p="lg">
          <Title order={3} mb="md">
            Pekerjaan
          </Title>
          <Stack gap="lg">
            {form.work.map((w, i) => (
              <Paper key={i} withBorder p="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={700}>
                    Pekerjaan {i + 1}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={`Hapus pekerjaan ${i + 1}`}
                    onClick={() =>
                      set({ work: form.work.filter((_, j) => j !== i) })
                    }
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput
                    label="Posisi / jabatan"
                    value={w.job_title}
                    onChange={(ev) =>
                      setWork(i, { job_title: ev.currentTarget.value })
                    }
                  />
                  <TextInput
                    label="Perusahaan / organisasi"
                    value={w.company}
                    onChange={(ev) =>
                      setWork(i, { company: ev.currentTarget.value })
                    }
                  />
                  <TextInput
                    label="Tahun mulai"
                    inputMode="numeric"
                    value={w.start_year}
                    error={badYear(w.start_year)}
                    onChange={(ev) =>
                      setWork(i, { start_year: ev.currentTarget.value })
                    }
                  />
                  <TextInput
                    label="Tahun selesai"
                    description="Kosongkan jika masih berjalan."
                    inputMode="numeric"
                    value={w.end_year}
                    error={badYear(w.end_year)}
                    onChange={(ev) =>
                      setWork(i, { end_year: ev.currentTarget.value })
                    }
                  />
                </SimpleGrid>
              </Paper>
            ))}
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() =>
                set({
                  work: [
                    ...form.work,
                    {
                      job_title: "",
                      company: "",
                      start_year: "",
                      end_year: "",
                    },
                  ],
                })
              }
            >
              Tambah pekerjaan
            </Button>
          </Stack>
        </Paper>
        <Paper p="lg">
          <Title order={3} mb="md">
            Kontak
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="WhatsApp"
              inputMode="tel"
              value={form.whatsapp}
              onChange={(e) => set({ whatsapp: e.currentTarget.value })}
            />
            <TextInput
              label="Instagram"
              value={form.instagram}
              onChange={(e) => set({ instagram: e.currentTarget.value })}
            />
            <TextInput
              label="ID Line"
              value={form.line}
              onChange={(e) => set({ line: e.currentTarget.value })}
            />
            <TextInput
              label="TikTok"
              value={form.tiktok}
              onChange={(e) => set({ tiktok: e.currentTarget.value })}
            />
            <TextInput
              label="LinkedIn"
              value={form.linkedin}
              onChange={(e) => set({ linkedin: e.currentTarget.value })}
            />
          </SimpleGrid>
        </Paper>
      </Stack>
    </Screen>
  );
}

/** `/kelola/peserta/:userId/profil`: edit the participant's kaderisasi profile. */
export function ProfileEditPage() {
  const { userId = "" } = useParams();
  const id = Number(userId);
  const query = useQuery({
    queryKey: profileKey(id),
    queryFn: () => staffApi.participantProfile(id),
  });
  if (!query.data)
    return (
      <Screen title="Ubah profil" back={`/kelola/peserta/${id}`} width="wide">
        <Loadable query={query}>{() => null}</Loadable>
      </Screen>
    );
  if (!query.data.profile)
    return (
      <Screen title="Ubah profil" back={`/kelola/peserta/${id}`} width="wide">
        <EmptyState
          title="Belum punya profil kaderisasi"
          description="Profil dibuat saat anggota melengkapinya di website kaderisasi."
        />
      </Screen>
    );
  return <EditForm userId={id} profile={query.data.profile} />;
}
