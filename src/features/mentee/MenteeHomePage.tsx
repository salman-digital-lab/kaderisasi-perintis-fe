import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Timeline,
  Title,
} from "@mantine/core";
import {
  IconCalendarEvent,
  IconMessageCircle,
  IconNotebook,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { participantApi } from "@/api/endpoints";
import type { JournalDetail } from "@/api/types";
import { useMe } from "@/auth/AuthProvider";
import { Screen } from "@/components/layout/Screen";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { EmptyState, Loadable, NewBadge, StatusBadge } from "@/components/ui";
import { JOURNAL_STATUS } from "@/content/labels";
import { estimatedMinutes } from "@/content/lapbulForm";
import {
  currentReportMonth,
  deadlines,
  fmtDate,
  monthLabel,
  now,
  relativeDays,
} from "@/lib/time";

function JournalCard({ detail }: { detail: JournalDetail }) {
  const j = detail.journal;
  const status = j?.status ?? "not_started";
  const due = deadlines(detail.month);
  const label = monthLabel(detail.month);
  let cta: { to: string; label: string } | null = null;
  if (detail.canEdit && status === "revision_requested")
    cta = { to: `/lapbul/${detail.month}/isi`, label: "Perbaiki sekarang" };
  else if (detail.canEdit && j)
    cta = { to: `/lapbul/${detail.month}/isi`, label: "Lanjutkan draf" };
  else if (detail.canEdit)
    cta = { to: `/lapbul/${detail.month}/isi`, label: "Isi sekarang" };
  else if (j)
    cta = { to: `/lapbul/${detail.month}`, label: "Lihat Catatan Perjalanan" };

  return (
    <Paper
      p="md"
      style={{
        borderColor: detail.canEdit ? "var(--mantine-color-blue-4)" : undefined,
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group wrap="nowrap" gap="sm" align="flex-start">
          <ThemeIcon size={40} radius="md" variant="light">
            <IconNotebook size={22} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed" fw={600}>
              Catatan Perjalanan
            </Text>
            <Title order={3}>{label}</Title>
          </div>
        </Group>
        <StatusBadge {...JOURNAL_STATUS[status]} />
      </Group>
      <Text size="sm" mt="sm">
        {detail.window === "upcoming" &&
          `Dibuka ${fmtDate(due.opensAt, "D MMMM")}.`}
        {detail.canEdit &&
          status !== "revision_requested" &&
          detail.window === "open" &&
          `Tenggat ${fmtDate(due.menteeDue, "dddd, D MMMM")} pukul 23.59 (${relativeDays(due.menteeDue)}). Perkiraan ± ${estimatedMinutes(detail.category)} menit.`}
        {detail.canEdit &&
          status !== "revision_requested" &&
          detail.window === "late" &&
          `Tenggat sudah lewat. Masih bisa dikirim sampai ${fmtDate(due.lockAt, "D MMMM")} dengan label Terlambat.`}
        {status === "revision_requested" &&
          detail.revisionDueAt &&
          `Mentor meminta perbaikan. Batas ${fmtDate(detail.revisionDueAt, "D MMMM")} (${relativeDays(detail.revisionDueAt)}).`}
        {!detail.canEdit &&
          status !== "revision_requested" &&
          detail.lockedReason}
      </Text>
      {j?.isLate && (
        <Text size="xs" c="orange.8" mt={4} fw={600}>
          Dikirim terlambat
        </Text>
      )}
      {cta && (
        <Button
          component={Link}
          to={cta.to}
          fullWidth
          mt="md"
          variant={detail.canEdit ? "filled" : "light"}
        >
          {cta.label}
        </Button>
      )}
    </Paper>
  );
}

export function MenteeHomePage() {
  const me = useMe();
  const month = currentReportMonth();
  const detail = useQuery({
    queryKey: ["p", "journal", month],
    queryFn: () => participantApi.myJournal(month!),
    enabled: !!month,
  });
  const journals = useQuery({
    queryKey: ["p", "journals"],
    queryFn: participantApi.myJournals,
  });
  const unread = journals.data?.filter((j) => j.responseUnread) ?? [];
  const firstName = me.profile.name.split(" ")[0];

  return (
    <Screen
      title="Beranda"
      subtitle={fmtDate(now(), "dddd, D MMMM YYYY")}
      actions={<RoleSwitcher />}
    >
      <Stack gap="md">
        <div>
          <Text size="sm" c="dimmed">
            Assalamu'alaikum,
          </Text>
          <Title order={1}>{firstName}</Title>
          <Text size="sm" c="dimmed" mt={4}>
            {me.mentor ? `Mentor ${me.mentor.name}` : "Belum ada mentor"}
            {me.coordinator ? ` · Koordinator ${me.coordinator.name}` : ""}
          </Text>
        </div>

        {unread.map((j) => (
          <Paper
            key={j.month}
            p="md"
            component={Link}
            to={`/lapbul/${j.month}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Group wrap="nowrap" gap="sm">
              <ThemeIcon size={40} radius="md" color="teal" variant="light">
                <IconMessageCircle size={22} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Group gap={6}>
                  <Text fw={700}>Tanggapan mentor</Text>
                  <NewBadge />
                </Group>
                <Text size="sm" c="dimmed">
                  Untuk Catatan Perjalanan {monthLabel(j.month)}
                </Text>
              </div>
            </Group>
          </Paper>
        ))}

        {!month ? (
          <EmptyState
            title="Program belum dimulai"
            description="Catatan Perjalanan pertama (November 2026) dibuka 1 Desember 2026."
          />
        ) : (
          <Loadable query={detail}>
            {(d) => (
              <>
                <JournalCard detail={d} />
                <Paper p="md">
                  <Group gap="sm" wrap="nowrap" mb="sm">
                    <ThemeIcon
                      size={40}
                      radius="md"
                      variant="light"
                      color="violet"
                    >
                      <IconCalendarEvent size={22} />
                    </ThemeIcon>
                    <div>
                      <Text size="xs" c="dimmed" fw={600}>
                        Sesi kelompok {monthLabel(d.month)}
                      </Text>
                      <Text fw={700}>
                        {d.autoData.session
                          ? fmtDate(
                              d.autoData.session.date,
                              "dddd, D MMMM YYYY",
                            )
                          : "Belum dilaporkan mentor"}
                      </Text>
                      {d.autoData.session && (
                        <Text size="sm" c="dimmed">
                          {d.autoData.session.theme}
                        </Text>
                      )}
                    </div>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Jadwal sesi disepakati bersama mentor di luar aplikasi.
                  </Text>
                </Paper>
                <Paper p="md">
                  <Title order={3} mb="sm">
                    Tanggal penting
                  </Title>
                  <Timeline
                    bulletSize={18}
                    lineWidth={2}
                    active={
                      [
                        deadlines(d.month).opensAt,
                        deadlines(d.month).menteeDue,
                        deadlines(d.month).lockAt,
                      ].filter((x) => now().isAfter(x)).length - 1
                    }
                  >
                    <Timeline.Item
                      title={`Tgl 1 · Lapbul ${monthLabel(d.month)} dibuka`}
                    />
                    <Timeline.Item title="Tgl 5 · Tenggat pengisian">
                      <Text size="xs" c="dimmed">
                        Setelahnya ditandai Terlambat
                      </Text>
                    </Timeline.Item>
                    <Timeline.Item title="Tgl 12 · Lapbul terkunci">
                      <Text size="xs" c="dimmed">
                        Mentor menanggapi paling lambat tanggal ini
                      </Text>
                    </Timeline.Item>
                  </Timeline>
                </Paper>
              </>
            )}
          </Loadable>
        )}
        {me.participant.status === "pending" && (
          <Alert color="orange" variant="light">
            Status kepesertaanmu masih menunggu keputusan pengelola.
          </Alert>
        )}
      </Stack>
    </Screen>
  );
}
