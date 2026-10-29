import {
  Button,
  Flex,
  Grid,
  Group,
  NativeSelect,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconDownload,
  IconFileImport,
  IconUserQuestion,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { staffApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import type { CoordinatorRecap, ExportKind } from "@/api/types";
import { DataTable, useTableLayout, type Column } from "@/components/DataTable";
import { DisplayTitle } from "@/components/brand";
import { Screen } from "@/components/layout/Screen";
import { EmptyState, Loadable, PageSection, Section } from "@/components/ui";
import { downloadCsv } from "@/lib/files";
import { currentReportMonth, monthLabel, reportMonths } from "@/lib/time";

const EXPORTS: { kind: ExportKind; label: string }[] = [
  { kind: "rekap-mentee", label: "Rekap mentee" },
  { kind: "tugas-mentor", label: "Tugas mentor (T1–T3)" },
  { kind: "status-lapbul", label: "Status lapbul" },
  { kind: "laporan-mentoring", label: "Laporan mentoring" },
  { kind: "data-peserta", label: "Data peserta" },
];

function StatTile({
  to,
  icon,
  value,
  label,
}: {
  to: string;
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Paper
      p="sm"
      component={Link}
      to={to}
      withBorder={false}
      bg="gray.0"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Text size="xl" fw={800} ff="Montserrat, sans-serif" c="blue.7">
          {value}
        </Text>
        {icon}
      </Group>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Paper>
  );
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

const COORDINATOR_COLUMNS: Column<CoordinatorRecap>[] = [
  {
    key: "name",
    header: "Koordinator",
    sortValue: (c) => c.coordinator.name,
    render: (c) => (
      <>
        <Text fw={700} size="sm">
          {c.coordinator.name}
        </Text>
        <Text size="xs" c="dimmed">
          {c.mentors} mentor · {c.mentees} mentee
        </Text>
      </>
    ),
  },
  {
    key: "submitted",
    header: "Lapbul terkirim",
    sortValue: (c) => (c.mentees ? c.submitted / c.mentees : 0),
    render: (c) => `${c.submitted}/${c.mentees}`,
  },
  {
    key: "late",
    header: "Terlambat",
    sortValue: (c) => c.late,
    render: (c) => c.late,
  },
  {
    key: "responded",
    header: "Ditanggapi",
    sortValue: (c) => (c.submitted ? c.responded / c.submitted : 0),
    render: (c) => `${c.responded}/${c.submitted}`,
  },
  {
    key: "flags",
    header: "Bendera aktif",
    sortValue: (c) => c.activeFlags,
    render: (c) => (
      <Text
        size="sm"
        fw={c.activeFlags ? 700 : undefined}
        c={c.activeFlags ? "red.8" : undefined}
      >
        {c.activeFlags}
      </Text>
    ),
  },
  {
    key: "reports",
    header: "Laporan mentor",
    sortValue: (c) => (c.mentors ? c.reportsVerified / c.mentors : 0),
    render: (c) => (
      <>
        {c.reportsSubmitted}/{c.mentors} diajukan
        <Text size="xs" c="dimmed">
          {c.reportsVerified}/{c.mentors} diverifikasi
        </Text>
      </>
    ),
  },
];

export function StaffDashboardPage() {
  const desktop = useTableLayout();
  const [month, setMonth] = useState(currentReportMonth() ?? "");
  const query = useQuery({
    queryKey: ["staff", "dashboard", month],
    queryFn: () => staffApi.dashboard(month || undefined),
    enabled: !!month,
  });
  const exportCsv = useMutation({
    mutationFn: (kind: ExportKind) => staffApi.exportCsv(kind, month),
    onSuccess: ({ filename, csv }) => downloadCsv(filename, csv),
    onError: (e) =>
      notifications.show({ color: "red", message: errorMessage(e) }),
  });

  if (!month)
    return (
      <Screen width="wide" title="Dasbor pemantauan">
        <EmptyState title="Program belum dimulai" />
      </Screen>
    );

  return (
    <Screen
      width="wide"
      title="Beasiswa Perintis"
      subtitle="Pengelola Perintis"
      hero={
        <Stack gap={4}>
          <Text size="sm">Rekap {monthLabel(month)}</Text>
          <DisplayTitle>Dasbor pemantauan</DisplayTitle>
        </Stack>
      }
    >
      <Stack gap="lg">
        <Paper p="lg" radius="lg" withBorder={false} className="raised">
          <Flex
            direction={{ base: "column", md: "row" }}
            gap="sm"
            align={{ md: "center" }}
          >
            <NativeSelect
              aria-label="Bulan laporan"
              w={{ md: 240 }}
              value={month}
              onChange={(e) => setMonth(e.currentTarget.value)}
              data={reportMonths().map((m) => ({
                value: m,
                label: monthLabel(m),
              }))}
            />
            {query.data && (
              <SimpleGrid cols={2} spacing="xs" style={{ flex: 1 }}>
                <StatTile
                  to="/kelola/tindak-lanjut"
                  icon={
                    <IconAlertTriangle
                      size={20}
                      color="var(--mantine-color-red-7)"
                    />
                  }
                  value={query.data.followupsOpen}
                  label="Perlu tindak lanjut"
                />
                <StatTile
                  to="/kelola/peserta?status=pending"
                  icon={
                    <IconUserQuestion
                      size={20}
                      color="var(--mantine-color-orange-7)"
                    />
                  }
                  value={query.data.withoutMentor}
                  label="Mentee tanpa mentor"
                />
              </SimpleGrid>
            )}
          </Flex>
        </Paper>
        <Loadable query={query}>
          {(d) => (
            <Grid gap="lg">
              <Grid.Col span={{ base: 12, md: 8 }} order={{ base: 1, md: 1 }}>
                <Section
                  title="Indikator"
                  description={`Bab 5.2 · ${monthLabel(d.month)}`}
                >
                  <SimpleGrid
                    cols={{ base: 1, md: 2 }}
                    spacing="xl"
                    verticalSpacing="lg"
                  >
                    {d.indicators.map((i) => {
                      const value = pct(i.numerator, i.denominator);
                      const ok =
                        i.denominator > 0 &&
                        i.numerator / i.denominator >= i.target;
                      return (
                        <div key={i.key}>
                          <Group justify="space-between" mb={4} wrap="nowrap">
                            <Text size="sm" fw={600}>
                              {i.label}
                            </Text>
                            <Text
                              size="sm"
                              fw={800}
                              c={ok ? "teal.8" : "orange.8"}
                            >
                              {i.denominator ? `${value}%` : "—"}
                            </Text>
                          </Group>
                          <Progress
                            value={value}
                            color={ok ? "teal" : "orange"}
                            size="md"
                            radius="xl"
                          />
                          <Text size="xs" c="dimmed" mt={2}>
                            {i.numerator}/{i.denominator} · target{" "}
                            {Math.round(i.target * 100)}%
                          </Text>
                        </div>
                      );
                    })}
                  </SimpleGrid>
                  <Text size="xs" c="dimmed" mt="lg">
                    Mentee yang kategorinya belum diisi belum dihitung. Sesi 0
                    dan kepuasan mentee dicatat di luar aplikasi.
                  </Text>
                </Section>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }} order={{ base: 3, md: 2 }}>
                <Stack gap="lg">
                  <Section
                    title="Ekspor CSV"
                    description="Kolom tetap; data sensitif tidak ikut. Angka sama dengan layar."
                  >
                    <Stack gap="xs">
                      {EXPORTS.map((e) => (
                        <Button
                          key={e.kind}
                          variant="light"
                          justify="space-between"
                          rightSection={<IconDownload size={18} />}
                          loading={
                            exportCsv.isPending &&
                            exportCsv.variables === e.kind
                          }
                          onClick={() => exportCsv.mutate(e.kind)}
                        >
                          {e.label}
                        </Button>
                      ))}
                    </Stack>
                  </Section>
                  <Button
                    component={Link}
                    to="/kelola/impor"
                    variant="default"
                    leftSection={<IconFileImport size={18} />}
                  >
                    Impor peserta
                  </Button>
                </Stack>
              </Grid.Col>
              <Grid.Col span={12} order={{ base: 2, md: 3 }}>
                <PageSection title="Per koordinator">
                  {desktop ? (
                    <DataTable
                      columns={COORDINATOR_COLUMNS}
                      rows={d.byCoordinator}
                      rowKey={(c) => c.coordinator.userId}
                    />
                  ) : (
                    <Stack gap="sm">
                      {d.byCoordinator.map((c) => (
                        <Paper key={c.coordinator.userId} p="lg">
                          <Group justify="space-between" mb="xs" wrap="nowrap">
                            <Text fw={700}>{c.coordinator.name}</Text>
                            <Text size="xs" c="dimmed">
                              {c.mentors} mentor · {c.mentees} mentee
                            </Text>
                          </Group>
                          <SimpleGrid cols={2} spacing={6} verticalSpacing={4}>
                            <Text size="sm">
                              Lapbul terkirim{" "}
                              <b>
                                {c.submitted}/{c.mentees}
                              </b>
                            </Text>
                            <Text size="sm">
                              Terlambat <b>{c.late}</b>
                            </Text>
                            <Text size="sm">
                              Ditanggapi{" "}
                              <b>
                                {c.responded}/{c.submitted}
                              </b>
                            </Text>
                            <Text
                              size="sm"
                              c={c.activeFlags ? "red.8" : undefined}
                            >
                              Bendera aktif <b>{c.activeFlags}</b>
                            </Text>
                            <Text size="sm">
                              Laporan diajukan{" "}
                              <b>
                                {c.reportsSubmitted}/{c.mentors}
                              </b>
                            </Text>
                            <Text size="sm">
                              Diverifikasi{" "}
                              <b>
                                {c.reportsVerified}/{c.mentors}
                              </b>
                            </Text>
                          </SimpleGrid>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </PageSection>
              </Grid.Col>
            </Grid>
          )}
        </Loadable>
      </Stack>
    </Screen>
  );
}
