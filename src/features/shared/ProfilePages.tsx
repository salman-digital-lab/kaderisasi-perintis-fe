import {
  Alert,
  Anchor,
  Badge,
  Chip,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAward,
  IconCertificate,
  IconCircleCheck,
  IconInfoCircle,
  IconLock,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router";
import { participantApi } from "@/api/endpoints";
import type { FullProfile } from "@/api/types";
import { Screen } from "@/components/layout/Screen";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import {
  Avatarish,
  EmptyState,
  KeyValue,
  Loadable,
  Section,
  StatusBadge,
} from "@/components/ui";
import {
  CATEGORY_LABEL,
  JOURNAL_STATUS,
  OVERRIDE_LABEL,
  PARTICIPANT_STATUS,
} from "@/content/labels";
import { fmtDate, monthLabel } from "@/lib/time";

const KADERISASI_URL = "https://kaderisasi.salmanitb.com";

function ProfileView({ data }: { data: FullProfile }) {
  const { profile: p, participant: pt } = data;
  const [category, setCategory] = useState<string>("Semua");
  const categories = [
    "Semua",
    ...new Set(data.activities.map((a) => a.category)),
  ];
  const activities = data.activities
    .filter((a) => category === "Semua" || a.category === category)
    .sort((a, b) => b.date.localeCompare(a.date));
  const status = PARTICIPANT_STATUS[pt.status];

  return (
    <Stack gap="md">
      <Paper p="md">
        <Group wrap="nowrap" align="flex-start">
          <Avatarish name={p.name} size={56} />
          <div style={{ minWidth: 0 }}>
            <Title order={2} size="h3">
              {p.name}
            </Title>
            <Text size="sm" c="dimmed">
              {p.university}
            </Text>
            <Text size="sm" c="dimmed">
              {p.major} · angkatan {p.intakeYear} · tingkat {data.tingkat}
            </Text>
            <Group gap={6} mt="xs">
              <StatusBadge label={status.label} tone={status.tone} />
              <Badge variant="light" color="blue" radius="sm" tt="none">
                {p.level}
              </Badge>
            </Group>
          </div>
        </Group>
      </Paper>

      {pt.isMentee && data.summary.month && (
        <Section
          title="Ringkasan pembinaan"
          description={monthLabel(data.summary.month)}
        >
          <KeyValue
            items={[
              [
                "Catatan Perjalanan",
                data.summary.journalStatus && (
                  <StatusBadge
                    {...JOURNAL_STATUS[data.summary.journalStatus]}
                  />
                ),
              ],
              [
                "Sesi kelompok",
                data.summary.sessionDate
                  ? fmtDate(data.summary.sessionDate, "dddd, D MMM YYYY")
                  : "Belum dilaporkan",
              ],
              [
                "Tanggapan terakhir",
                data.summary.lastResponse ? (
                  <Text size="sm" lineClamp={3} className="multiline">
                    {data.summary.lastResponse}
                  </Text>
                ) : (
                  "—"
                ),
              ],
            ]}
          />
        </Section>
      )}

      <Section title="Identitas">
        <KeyValue
          items={[
            ...(pt.isMentee
              ? ([
                  ["NIM", pt.nim],
                  [
                    "Kategori",
                    data.sensitiveHidden ? (
                      <HiddenValue />
                    ) : (
                      pt.category && CATEGORY_LABEL[pt.category]
                    ),
                  ],
                  [
                    "KIP-K",
                    data.sensitiveHidden ? (
                      <HiddenValue />
                    ) : pt.kipK == null ? (
                      "—"
                    ) : pt.kipK ? (
                      "Ya"
                    ) : (
                      "Tidak"
                    ),
                  ],
                  ["Mentor", data.mentor?.name ?? "Belum ada"],
                  ["Koordinator", data.coordinator?.name],
                ] as [string, React.ReactNode][])
              : []),
            ["Jenis kelamin", p.gender === "L" ? "Laki-laki" : "Perempuan"],
            ["WhatsApp", p.phone],
            ["Instagram", p.instagram],
            ["LinkedIn", p.linkedin],
            ["Domisili", p.domicile],
          ]}
        />
        <Text size="xs" c="dimmed" mt="sm">
          Identitas dan kontak diambil dari profil Kaderisasi Salman. Data
          keliru? Sampaikan ke mentor atau pengelola.
        </Text>
      </Section>

      <Section title="Status kaderisasi">
        <KeyValue
          items={[
            ["SSC", p.sscStatus],
            ["LMD", p.lmdStatus],
            ...(pt.kaderisasiOverride
              ? ([
                  [
                    "Status manual",
                    `${OVERRIDE_LABEL[pt.kaderisasiOverride]}${pt.kaderisasiOverrideNote ? ` · ${pt.kaderisasiOverrideNote}` : ""}`,
                  ],
                ] as [string, string][])
              : []),
            ["Level kader", p.level],
          ]}
        />
      </Section>

      <Section title="Unit & club">
        {data.clubs.length ? (
          <Stack gap="xs">
            <Group gap={6} c="green.8">
              <IconCircleCheck size={18} />
              <Text size="sm" fw={600}>
                Terdaftar minimal satu unit/club
              </Text>
            </Group>
            {data.clubs.map((c) => (
              <Group key={c.name} justify="space-between" wrap="nowrap">
                <Text size="sm" fw={500}>
                  {c.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {c.role}
                </Text>
              </Group>
            ))}
          </Stack>
        ) : (
          <Alert
            color="orange"
            variant="light"
            icon={<IconInfoCircle size={18} />}
          >
            Belum terdaftar di unit/club (batas 30 Nov).{" "}
            <Anchor href={`${KADERISASI_URL}/clubs`} target="_blank" fw={600}>
              Daftar di website kaderisasi
            </Anchor>
          </Alert>
        )}
      </Section>

      <Section title="Riwayat kegiatan">
        {categories.length > 2 && (
          <Chip.Group
            value={category}
            onChange={(v) => setCategory(v as string)}
          >
            <Group gap={6} mb="sm" wrap="nowrap" className="hscroll">
              {categories.map((c) => (
                <Chip key={c} value={c} size="sm">
                  {c}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        )}
        {activities.length ? (
          <Stack gap="sm">
            {activities.map((a) => (
              <Group key={a.name} wrap="nowrap" align="flex-start" gap="sm">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600}>
                    {a.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {a.category} · {fmtDate(a.date)}
                  </Text>
                </div>
                <Group gap={4} wrap="nowrap">
                  {a.certificate && (
                    <IconCertificate
                      size={18}
                      color="var(--mantine-color-blue-7)"
                      aria-label="Ada sertifikat"
                    />
                  )}
                  <StatusBadge
                    label={a.status}
                    tone={a.status === "Lulus" ? "green" : "gray"}
                  />
                </Group>
              </Group>
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            Belum ada kegiatan.
          </Text>
        )}
      </Section>

      <Section title="Prestasi">
        {data.achievements.length ? (
          <Stack gap="sm">
            {data.achievements.map((a) => (
              <Group key={a.name} wrap="nowrap" align="flex-start" gap="sm">
                <IconAward size={20} color="var(--mantine-color-yellow-7)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600}>
                    {a.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {a.level} · {a.year} · {a.status}
                  </Text>
                </div>
              </Group>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={IconAward}
            title="Belum ada prestasi"
            description="Prestasi yang diajukan di website kaderisasi akan muncul di sini."
          />
        )}
      </Section>
    </Stack>
  );
}

function HiddenValue() {
  return (
    <Group gap={4} c="dimmed">
      <IconLock size={14} />
      <Text size="sm">Disembunyikan</Text>
    </Group>
  );
}

export function MyProfilePage() {
  const query = useQuery({
    queryKey: ["p", "my-profile"],
    queryFn: participantApi.myProfile,
  });
  return (
    <Screen title="Profil" actions={<RoleSwitcher />}>
      <Loadable query={query}>{(data) => <ProfileView data={data} />}</Loadable>
    </Screen>
  );
}

export function MenteeProfilePage({ back }: { back: string }) {
  const { userId } = useParams();
  const query = useQuery({
    queryKey: ["p", "mentee-profile", userId],
    queryFn: () => participantApi.menteeProfile(Number(userId)),
  });
  return (
    <Screen
      title={query.data?.profile.name ?? "Profil mentee"}
      subtitle="Profil mentee"
      back={back}
    >
      <Loadable query={query}>
        {(data) => (
          <Stack gap="md">
            {data.sensitiveHidden && (
              <Alert color="gray" variant="light" icon={<IconLock size={18} />}>
                Sebagai koordinator, data ekonomi, keluarga, dan kesehatan tidak
                ditampilkan.
              </Alert>
            )}
            <ProfileView data={data} />
          </Stack>
        )}
      </Loadable>
    </Screen>
  );
}
