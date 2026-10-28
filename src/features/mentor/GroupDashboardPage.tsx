import {
  Anchor,
  Button,
  Flex,
  Group,
  NativeSelect,
  Paper,
  SimpleGrid,
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
import { DisplayTitle, InfoPill } from "@/components/brand";
import { DataTable, useTableLayout, type Column } from "@/components/DataTable";
import { Screen } from "@/components/layout/Screen";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import {
  Avatarish,
  EmptyState,
  LinkRow,
  ListGroup,
  Loadable,
  Note,
  PageSection,
  StatusBadge,
} from "@/components/ui";
import {
  categoryLabel,
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

const canOpen = (r: DashboardRow) =>
  !!r.journalId && r.status !== "draft" && r.status !== "not_started";

/** Sent lapbul open for responding; mentees who have not sent one open their profile. */
const rowTarget = (r: DashboardRow) =>
  canOpen(r)
    ? `/kelompok/lapbul/${r.journalId}`
    : `/kelompok/mentee/${r.mentee.userId}`;

const COLUMNS: Column<DashboardRow>[] = [
  {
    key: "name",
    header: "Mentee",
    sortValue: (r) => r.mentee.name,
    render: (r) => (
      <Group gap="sm" wrap="nowrap">
        <Avatarish name={r.mentee.name} size={34} />
        <div style={{ minWidth: 0 }}>
          <Anchor
            component={Link}
            to={rowTarget(r)}
            fw={700}
            c="inherit"
            onClick={(e) => e.stopPropagation()}
          >
            {r.mentee.name}
          </Anchor>
          <Text size="xs" c="dimmed">
            T{r.mentee.tingkat} · {categoryLabel(r.mentee.category)}
          </Text>
        </div>
      </Group>
    ),
  },
  {
    key: "status",
    header: "Lapbul",
    sortValue: (r) => JOURNAL_STATUS[r.status].label,
    render: (r) => (
      <Group gap={6} wrap="nowrap">
        <StatusBadge {...JOURNAL_STATUS[r.status]} />
        {r.isLate && (
          <Text size="xs" c="orange.8" fw={600}>
            Terlambat
          </Text>
        )}
      </Group>
    ),
  },
  {
    key: "submitted",
    header: "Dikirim",
    nowrap: true,
    sortValue: (r) => r.submittedAt ?? "",
    render: (r) =>
      r.submittedAt ? fmtDate(r.submittedAt, "D MMM, HH.mm") : "—",
  },
  {
    key: "attention",
    header: "Perhatian",
    render: (r) =>
      r.flag || r.inactiveStreak ? (
        <Stack gap={4}>
          {r.flag && <StatusBadge {...FLAG_STATUS[r.flag.status]} />}
          {r.inactiveStreak && (
            <Group gap={2} c="red.8" wrap="nowrap">
              <IconUserExclamation size={14} />
              <Text size="xs" fw={600}>
                2 bulan tanpa lapbul
              </Text>
            </Group>
          )}
        </Stack>
      ) : (
        "—"
      ),
  },
  {
    key: "action",
    header: "",
    nowrap: true,
    render: (r) => (
      <Group justify="flex-end">
        <Button
          size="xs"
          variant={canOpen(r) ? "light" : "default"}
          component={Link}
          to={rowTarget(r)}
          onClick={(e) => e.stopPropagation()}
        >
          {canOpen(r) ? "Buka lapbul" : "Lihat profil"}
        </Button>
      </Group>
    ),
  },
];

export function GroupDashboardPage() {
  const desktop = useTableLayout();
  const current = currentReportMonth();
  const [month, setMonth] = useState(current ?? "");
  const query = useQuery({
    queryKey: ["p", "mentor-dashboard", month],
    queryFn: () => participantApi.mentorDashboard(month || undefined),
    enabled: !!month,
  });

  if (!current)
    return (
      <Screen width="wide" title="Kelompok" actions={<RoleSwitcher />}>
        <EmptyState
          title="Program belum dimulai"
          description="Dasbor terisi setelah lapbul November dibuka 1 Desember 2026."
        />
      </Screen>
    );

  const due = deadlines(month);
  return (
    <Screen
      width="wide"
      title="Beasiswa Perintis"
      subtitle="Mentor"
      actions={<RoleSwitcher />}
      hero={
        <Stack gap={4}>
          <Text size="sm">Dasbor kelompok</Text>
          <DisplayTitle>Kelompok saya</DisplayTitle>
          {query.data && (
            <Text size="sm" fw={600} opacity={0.92}>
              Tingkat {query.data.tingkat} · {query.data.rows.length} mentee
            </Text>
          )}
        </Stack>
      }
    >
      <Stack gap="lg">
        <Paper p="lg" radius="lg" withBorder={false} className="raised">
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={{ base: 0, md: "xl" }}
            align={{ md: "center" }}
          >
            <NativeSelect
              aria-label="Bulan laporan"
              w={{ md: 260 }}
              value={month}
              onChange={(e) => setMonth(e.currentTarget.value)}
              data={reportMonths().map((m) => ({
                value: m,
                label: `Lapbul ${monthLabel(m)}`,
              }))}
            />
            {query.data && (
              <Flex
                direction={{ base: "column", md: "row" }}
                align={{ md: "center" }}
                justify="space-between"
                gap={{ md: "lg" }}
                style={{ flex: 1 }}
              >
                <Title
                  order={2}
                  mt={{ base: "md", md: 0 }}
                  mb={{ base: "sm", md: 0 }}
                >
                  {query.data.toRespond
                    ? `${query.data.toRespond} lapbul perlu ditanggapi`
                    : "Semua lapbul sudah ditanggapi"}
                </Title>
                <InfoPill
                  icon={<IconClock size={17} />}
                  label={`Tenggat tanggapan · ${relativeDays(due.mentorDue)}`}
                  value={fmtDate(due.mentorDue, "dddd, D MMMM YYYY")}
                />
              </Flex>
            )}
          </Flex>
        </Paper>
        <Loadable query={query}>
          {(d) => {
            const flags = d.rows.filter(
              (r) =>
                r.flag &&
                (r.flag.status === "open" || r.flag.status === "escalated"),
            );
            return (
              <>
                {flags.length > 0 && (
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    {flags.map((r) => (
                      <FlagBox key={r.mentee.userId} row={r} />
                    ))}
                  </SimpleGrid>
                )}
                <PageSection title="Mentee">
                  {d.rows.length && desktop ? (
                    <DataTable
                      columns={COLUMNS}
                      rows={d.rows}
                      rowKey={(r) => r.mentee.userId}
                      rowHref={rowTarget}
                    />
                  ) : d.rows.length ? (
                    <ListGroup>
                      {d.rows.map((r) => {
                        return (
                          <LinkRow
                            key={r.mentee.userId}
                            to={rowTarget(r)}
                            icon={<Avatarish name={r.mentee.name} />}
                            title={r.mentee.name}
                            description={
                              <Stack gap={4}>
                                <Text size="xs" c="dimmed">
                                  T{r.mentee.tingkat} ·{" "}
                                  {categoryLabel(r.mentee.category)}
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
                    </ListGroup>
                  ) : (
                    <EmptyState
                      title="Belum ada mentee"
                      description="Pengelola akan menetapkan mentee ke kelompokmu."
                    />
                  )}
                </PageSection>
                <Note>
                  Lapbul yang sudah terkirim bisa dibuka untuk ditanggapi.
                  Mentee yang belum mengisi membuka profilnya.
                </Note>
              </>
            );
          }}
        </Loadable>
      </Stack>
    </Screen>
  );
}
