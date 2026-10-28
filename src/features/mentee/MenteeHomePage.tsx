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
  IconChevronRight,
  IconMessageCircle,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { participantApi } from "@/api/endpoints";
import type { JournalDetail } from "@/api/types";
import { useMe } from "@/auth/AuthProvider";
import { Screen } from "@/components/layout/Screen";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { DisplayTitle, Eyebrow, InfoPill } from "@/components/brand";
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

  const showDue =
    detail.canEdit &&
    status !== "revision_requested" &&
    detail.window === "open";
  return (
    <Paper p="lg" radius="lg" withBorder={false} className="raised">
      <Group justify="space-between" wrap="nowrap" align="center">
        <Eyebrow>Catatan Perjalanan</Eyebrow>
        <StatusBadge {...JOURNAL_STATUS[status]} />
      </Group>
      <Title order={2} mt={6} mb="sm">
        {label}
      </Title>
      {showDue && (
        <InfoPill
          icon={<IconCalendarEvent size={17} />}
          label={`Tenggat pengisian · ${relativeDays(due.menteeDue)}`}
          value={fmtDate(due.menteeDue, "dddd, D MMMM YYYY")}
        />
      )}
      <Text size="sm" mt="sm" c={showDue ? "dimmed" : undefined}>
        {detail.window === "upcoming" &&
          `Dibuka ${fmtDate(due.opensAt, "D MMMM")}.`}
        {showDue &&
          `Paling lambat pukul 23.59 WIB. Perkiraan ± ${estimatedMinutes(detail.category)} menit.`}
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
      title="Beasiswa Perintis"
      subtitle={fmtDate(now(), "dddd, D MMMM YYYY")}
      actions={<RoleSwitcher />}
      hero={
        <Stack gap={4}>
          <Text size="sm">Assalamu'alaikum, {firstName}</Text>
          <DisplayTitle>Terus melangkah, catat perjalananmu</DisplayTitle>
          <Text size="xs" mt={4} opacity={0.92}>
            {me.mentor ? `Mentor ${me.mentor.name}` : "Belum ada mentor"}
            {me.coordinator ? ` · Koordinator ${me.coordinator.name}` : ""}
          </Text>
        </Stack>
      }
    >
      <Stack gap="md">
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
                {unread.map((j) => (
                  <Paper
                    key={j.month}
                    p="md"
                    component={Link}
                    to={`/lapbul/${j.month}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Group wrap="nowrap" gap="sm">
                      <ThemeIcon
                        size={40}
                        radius="md"
                        color="teal"
                        variant="light"
                      >
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
                      <IconChevronRight
                        size={18}
                        color="var(--mantine-color-dimmed)"
                      />
                    </Group>
                  </Paper>
                ))}
                <Paper p="md">
                  <Group gap="sm" wrap="nowrap" align="flex-start">
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
                      <Text size="xs" c="dimmed" mt={4}>
                        Jadwal sesi disepakati bersama mentor di luar aplikasi.
                      </Text>
                    </div>
                  </Group>
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
          <Alert color="yellow" variant="light">
            Status kepesertaanmu masih menunggu keputusan pengelola.
          </Alert>
        )}
      </Stack>
    </Screen>
  );
}
