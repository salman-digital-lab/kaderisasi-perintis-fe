import {
  Anchor,
  Badge,
  Button,
  Flex,
  Group,
  NativeSelect,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconCalendarEvent,
  IconAlertTriangle,
  IconShieldLock,
  IconTrendingDown,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { participantApi } from "@/api/endpoints";
import { Link } from "react-router";
import type { CoordinatorRow, MentorTasks } from "@/api/types";
import { DisplayTitle, InfoPill } from "@/components/brand";
import { DataTable, useTableLayout, type Column } from "@/components/DataTable";
import { Screen } from "@/components/layout/Screen";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import {
  EmptyState,
  LinkRow,
  ListGroup,
  Loadable,
  PageSection,
  StatusBadge,
} from "@/components/ui";
import { REPORT_STATUS, TASK_LABEL } from "@/content/labels";
import {
  currentReportMonth,
  deadlines,
  fmtDate,
  monthLabel,
  relativeDays,
  reportMonths,
} from "@/lib/time";

function TaskChips({ tasks }: { tasks: MentorTasks }) {
  return (
    <Group gap={4}>
      {(Object.keys(TASK_LABEL) as (keyof MentorTasks)[]).map((k) => (
        <Tooltip
          key={k}
          label={TASK_LABEL[k]}
          events={{ hover: true, focus: true, touch: true }}
        >
          <Badge
            size="sm"
            radius="sm"
            variant={tasks[k] ? "filled" : "outline"}
            color={tasks[k] ? "teal" : "gray"}
          >
            {k.toUpperCase()}
          </Badge>
        </Tooltip>
      ))}
    </Group>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <Paper p="sm">
      <Text size="xl" fw={800} ff="Montserrat, sans-serif" c={tone ?? "blue.7"}>
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Paper>
  );
}

export function CoordinatorPanelPage() {
  const desktop = useTableLayout();
  const current = currentReportMonth();
  const [month, setMonth] = useState(current ?? "");
  const query = useQuery({
    queryKey: ["p", "coordinator", month],
    queryFn: () => participantApi.coordinatorOverview(month || undefined),
    enabled: !!month,
  });
  if (!current)
    return (
      <Screen width="wide" title="Panel koordinator" actions={<RoleSwitcher />}>
        <EmptyState title="Program belum dimulai" />
      </Screen>
    );
  const due = deadlines(month);
  const reportHref = (r: CoordinatorRow) =>
    `/koordinator/laporan/${r.mentor.userId}/${month}`;
  const columns: Column<CoordinatorRow>[] = [
    {
      key: "mentor",
      header: "Mentor",
      sortValue: (r) => r.mentor.name,
      render: (r) => (
        <>
          <Anchor
            component={Link}
            to={reportHref(r)}
            fw={700}
            c="inherit"
            onClick={(e) => e.stopPropagation()}
          >
            {r.mentor.name}
          </Anchor>
          <Text size="xs" c="dimmed">
            {r.menteeCount} mentee · tingkat {r.tingkat}
          </Text>
        </>
      ),
    },
    {
      key: "report",
      header: "Laporan",
      sortValue: (r) => REPORT_STATUS[r.report?.status ?? "not_started"].label,
      render: (r) => (
        <Stack gap={4} align="flex-start">
          <StatusBadge {...REPORT_STATUS[r.report?.status ?? "not_started"]} />
          {r.report?.isLate && <StatusBadge label="Terlambat" tone="orange" />}
          {r.report?.hasCase && (
            <Group gap={2} c="orange.8" wrap="nowrap">
              <IconShieldLock size={14} />
              <Text size="xs" fw={600}>
                Ada kasus
              </Text>
            </Group>
          )}
        </Stack>
      ),
    },
    {
      key: "journals",
      header: "Lapbul",
      sortValue: (r) =>
        r.menteeCount ? r.journals.submitted / r.menteeCount : 0,
      render: (r) => (
        <Text size="sm">
          {r.journals.submitted}/{r.menteeCount} terkirim
          <br />
          <Text span size="xs" c="dimmed">
            {r.journals.responded} ditanggapi
            {r.journals.late ? ` · ${r.journals.late} terlambat` : ""}
          </Text>
        </Text>
      ),
    },
    {
      key: "attention",
      header: "Perhatian",
      sortValue: (r) => r.escalatedFlags * 10 + r.patternFlags,
      render: (r) =>
        r.escalatedFlags || r.patternFlags ? (
          <Stack gap={4}>
            {r.escalatedFlags > 0 && (
              <Group gap={2} c="red.8" wrap="nowrap">
                <IconAlertTriangle size={14} />
                <Text size="xs" fw={600}>
                  {r.escalatedFlags} bendera
                </Text>
              </Group>
            )}
            {r.patternFlags > 0 && (
              <Group gap={2} c="red.8" wrap="nowrap">
                <IconTrendingDown size={14} />
                <Text size="xs" fw={600}>
                  Pola pulse rendah
                </Text>
              </Group>
            )}
          </Stack>
        ) : (
          "—"
        ),
    },
    {
      key: "tasks",
      header: "Tugas",
      nowrap: true,
      sortValue: (r) => Object.values(r.tasks).filter(Boolean).length,
      render: (r) => <TaskChips tasks={r.tasks} />,
    },
    {
      key: "action",
      header: "",
      nowrap: true,
      render: (r) => (
        <Group justify="flex-end">
          <Button
            size="xs"
            variant={r.report?.status === "submitted" ? "filled" : "light"}
            component={Link}
            to={reportHref(r)}
            onClick={(e) => e.stopPropagation()}
          >
            {r.report?.status === "submitted" ? "Periksa" : "Buka"}
          </Button>
        </Group>
      ),
    },
  ];
  return (
    <Screen
      width="wide"
      title="Beasiswa Perintis"
      subtitle="Koordinator"
      actions={<RoleSwitcher />}
      hero={
        <Stack gap={4}>
          <Text size="sm">Laporan mentoring {monthLabel(month)}</Text>
          <DisplayTitle>Panel koordinator</DisplayTitle>
          {query.data && (
            <Text size="sm" fw={600} opacity={0.92}>
              {query.data.rows.length} mentor binaan
            </Text>
          )}
        </Stack>
      }
    >
      <Stack gap="lg">
        <Paper p="lg" radius="lg" withBorder={false} className="raised">
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={{ base: "md", md: "xl" }}
            align={{ md: "center" }}
            justify="space-between"
          >
            <NativeSelect
              aria-label="Bulan laporan"
              w={{ md: 260 }}
              value={month}
              onChange={(e) => setMonth(e.currentTarget.value)}
              data={reportMonths().map((m) => ({
                value: m,
                label: monthLabel(m),
              }))}
            />
            <InfoPill
              icon={<IconCalendarEvent size={17} />}
              label={`Tenggat verifikasi · ${relativeDays(due.verifyDue)}`}
              value={fmtDate(due.verifyDue, "dddd, D MMMM YYYY")}
            />
          </Flex>
        </Paper>
        <Loadable query={query}>
          {(d) => {
            const waiting = d.rows.filter(
              (r) => r.report?.status === "submitted",
            ).length;
            const escalated = d.rows.reduce((n, r) => n + r.escalatedFlags, 0);
            const verified = d.rows.filter(
              (r) => r.report?.status === "verified",
            ).length;
            const sorted = [...d.rows].sort(
              (a, b) =>
                Number(b.report?.status === "submitted") -
                  Number(a.report?.status === "submitted") ||
                b.escalatedFlags - a.escalatedFlags ||
                a.mentor.name.localeCompare(b.mentor.name),
            );
            return (
              <>
                <SimpleGrid cols={3} spacing="xs">
                  <Stat
                    label="Menunggu verifikasi"
                    value={waiting}
                    tone={waiting ? "blue.8" : undefined}
                  />
                  <Stat
                    label="Diverifikasi"
                    value={`${verified}/${d.rows.length}`}
                  />
                  <Stat
                    label="Bendera tereskalasi"
                    value={escalated}
                    tone={escalated ? "red.8" : undefined}
                  />
                </SimpleGrid>
                <PageSection title="Mentor binaan">
                  {sorted.length && desktop ? (
                    <DataTable
                      columns={columns}
                      rows={sorted}
                      rowKey={(r) => r.mentor.userId}
                      rowHref={reportHref}
                    />
                  ) : sorted.length ? (
                    <ListGroup>
                      {sorted.map((r) => (
                        <LinkRow
                          key={r.mentor.userId}
                          to={reportHref(r)}
                          title={r.mentor.name}
                          description={
                            <Stack gap={6}>
                              <Text size="xs" c="dimmed">
                                {r.menteeCount} mentee · tingkat {r.tingkat} ·
                                lapbul {r.journals.submitted} terkirim,{" "}
                                {r.journals.responded} ditanggapi
                                {r.journals.late
                                  ? `, ${r.journals.late} terlambat`
                                  : ""}
                              </Text>
                              <Group gap={6}>
                                <StatusBadge
                                  {...REPORT_STATUS[
                                    r.report?.status ?? "not_started"
                                  ]}
                                />
                                {r.report?.isLate && (
                                  <StatusBadge
                                    label="Terlambat"
                                    tone="orange"
                                  />
                                )}
                                {r.report?.hasCase && (
                                  <Group gap={2} c="orange.8">
                                    <IconShieldLock size={14} />
                                    <Text size="xs" fw={600}>
                                      Ada kasus
                                    </Text>
                                  </Group>
                                )}
                                {r.escalatedFlags > 0 && (
                                  <Group gap={2} c="red.8">
                                    <IconAlertTriangle size={14} />
                                    <Text size="xs" fw={600}>
                                      {r.escalatedFlags} bendera
                                    </Text>
                                  </Group>
                                )}
                                {r.patternFlags > 0 && (
                                  <Group gap={2} c="red.8">
                                    <IconTrendingDown size={14} />
                                    <Text size="xs" fw={600}>
                                      Pola pulse rendah
                                    </Text>
                                  </Group>
                                )}
                              </Group>
                              <TaskChips tasks={r.tasks} />
                            </Stack>
                          }
                        />
                      ))}
                    </ListGroup>
                  ) : (
                    <EmptyState title="Belum ada mentor binaan" />
                  )}
                </PageSection>
                <Text size="xs" c="dimmed">
                  Koordinator melihat status saja: isi lapbul, data ekonomi, dan
                  isi kasus tidak ditampilkan.
                </Text>
              </>
            );
          }}
        </Loadable>
      </Stack>
    </Screen>
  );
}
