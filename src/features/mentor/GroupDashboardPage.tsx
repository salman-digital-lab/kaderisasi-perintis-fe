import {
  Alert,
  Button,
  Group,
  NativeSelect,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconClock,
  IconUserExclamation,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { participantApi } from "@/api/endpoints";
import type { DashboardRow } from "@/api/types";
import { Screen } from "@/components/layout/Screen";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import {
  Avatarish,
  EmptyState,
  LinkRow,
  Loadable,
  StatusBadge,
} from "@/components/ui";
import {
  CATEGORY_LABEL,
  FLAG_STATUS,
  FLAG_TRIGGER,
  JOURNAL_STATUS,
} from "@/content/labels";
import {
  currentReportMonth,
  deadlines,
  fmtDate,
  hoursLeft,
  monthLabel,
  relativeDays,
  reportMonths,
} from "@/lib/time";

function FlagBox({ row }: { row: DashboardRow }) {
  const flag = row.flag!;
  const escalated = flag.status === "escalated";
  return (
    <Paper
      p="md"
      style={{
        borderColor: "var(--mantine-color-red-4)",
        background: "var(--mantine-color-red-0)",
      }}
    >
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <ThemeIcon color="red" variant="filled" size={36} radius="md">
          <IconAlertTriangle size={20} />
        </ThemeIcon>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} justify="space-between" wrap="nowrap">
            <Text fw={700}>{row.mentee.name}</Text>
            <StatusBadge {...FLAG_STATUS[flag.status]} variant="filled" />
          </Group>
          <Text size="sm">{FLAG_TRIGGER[flag.trigger]}</Text>
          <Text size="xs" c="red.9" fw={600} mt={2}>
            {escalated
              ? flag.handledAt
                ? "Sudah dihubungi · menunggu pengelola menutup"
                : "Lewat 3 hari · sudah diteruskan ke koordinator & pengelola"
              : `Hubungi dalam ${hoursLeft(flag.dueAt)}`}
          </Text>
          <Button
            component={Link}
            to={`/kelompok/lapbul/${flag.journalId}`}
            size="xs"
            color="red"
            mt="sm"
            variant={escalated ? "light" : "filled"}
          >
            {flag.handledAt ? "Lihat lapbul" : "Tangani sekarang"}
          </Button>
        </div>
      </Group>
    </Paper>
  );
}

export function GroupDashboardPage() {
  const current = currentReportMonth();
  const [month, setMonth] = useState(current ?? "");
  const query = useQuery({
    queryKey: ["p", "mentor-dashboard", month],
    queryFn: () => participantApi.mentorDashboard(month || undefined),
    enabled: !!month,
  });

  if (!current)
    return (
      <Screen title="Kelompok" actions={<RoleSwitcher />}>
        <EmptyState
          title="Program belum dimulai"
          description="Dasbor terisi setelah lapbul November dibuka 1 Desember 2026."
        />
      </Screen>
    );

  const due = deadlines(month);
  return (
    <Screen
      title="Kelompok saya"
      subtitle={
        query.data
          ? `Tingkat ${query.data.tingkat} · ${query.data.rows.length} mentee`
          : undefined
      }
      actions={<RoleSwitcher />}
    >
      <Stack gap="md">
        <NativeSelect
          aria-label="Bulan laporan"
          value={month}
          onChange={(e) => setMonth(e.currentTarget.value)}
          data={reportMonths().map((m) => ({
            value: m,
            label: `Lapbul ${monthLabel(m)}`,
          }))}
        />
        <Loadable query={query}>
          {(d) => {
            const flags = d.rows.filter(
              (r) =>
                r.flag &&
                (r.flag.status === "open" || r.flag.status === "escalated"),
            );
            return (
              <>
                <Paper
                  p="md"
                  bg={d.toRespond ? "var(--mantine-color-blue-0)" : undefined}
                >
                  <Group wrap="nowrap" gap="sm">
                    <ThemeIcon size={40} radius="md" variant="light">
                      <IconClock size={22} />
                    </ThemeIcon>
                    <div>
                      <Title order={3}>
                        {d.toRespond
                          ? `${d.toRespond} lapbul perlu ditanggapi`
                          : "Semua lapbul terkirim sudah ditanggapi"}
                      </Title>
                      <Text size="sm" c="dimmed">
                        Tenggat tanggapan{" "}
                        {fmtDate(due.mentorDue, "dddd, D MMM")} ·{" "}
                        {relativeDays(due.mentorDue)}
                      </Text>
                    </div>
                  </Group>
                </Paper>
                {flags.map((r) => (
                  <FlagBox key={r.mentee.userId} row={r} />
                ))}
                <div>
                  <Title order={3} mb="xs">
                    Mentee
                  </Title>
                  {d.rows.length ? (
                    <Stack gap="xs">
                      {d.rows.map((r) => {
                        const canOpen =
                          r.journalId &&
                          r.status !== "draft" &&
                          r.status !== "not_started";
                        return (
                          <LinkRow
                            key={r.mentee.userId}
                            to={
                              canOpen
                                ? `/kelompok/lapbul/${r.journalId}`
                                : `/kelompok/mentee/${r.mentee.userId}`
                            }
                            icon={<Avatarish name={r.mentee.name} />}
                            title={r.mentee.name}
                            description={
                              <Stack gap={4}>
                                <Text size="xs" c="dimmed">
                                  T{r.mentee.tingkat} ·{" "}
                                  {CATEGORY_LABEL[r.mentee.category]}
                                </Text>
                                <Group gap={6}>
                                  <StatusBadge {...JOURNAL_STATUS[r.status]} />
                                  {r.isLate && (
                                    <Text size="xs" c="orange.8" fw={600}>
                                      Terlambat
                                    </Text>
                                  )}
                                  {r.inactiveStreak && (
                                    <Group gap={2} c="red.8">
                                      <IconUserExclamation size={14} />
                                      <Text size="xs" fw={600}>
                                        2 bulan tanpa lapbul
                                      </Text>
                                    </Group>
                                  )}
                                </Group>
                              </Stack>
                            }
                          />
                        );
                      })}
                    </Stack>
                  ) : (
                    <EmptyState
                      title="Belum ada mentee"
                      description="Pengelola akan menetapkan mentee ke kelompokmu."
                    />
                  )}
                </div>
                <Alert variant="light" color="gray">
                  Lapbul yang sudah terkirim bisa dibuka untuk ditanggapi.
                  Mentee yang belum mengisi membuka profilnya.
                </Alert>
              </>
            );
          }}
        </Loadable>
      </Stack>
    </Screen>
  );
}
