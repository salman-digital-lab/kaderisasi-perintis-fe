import {
  Anchor,
  Group,
  List,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconBook2,
  IconCircleCheck,
  IconCircleDashed,
  IconMessage2,
  IconShieldLock,
} from "@tabler/icons-react";
import type {
  CurriculumItem,
  MentorTasks,
  ReportDetail,
  SessionReport,
} from "@/api/types";
import { KeyValue, MultilineText, NewBadge } from "@/components/ui";
import { TASK_LABEL } from "@/content/labels";
import { fmtDate, fmtDateTime } from "@/lib/time";
import { FileList } from "./JournalContent";

export function TasksChecklist({ tasks }: { tasks: MentorTasks }) {
  return (
    <Paper p="lg">
      <Title order={3} mb="sm">
        Tugas mentor bulan ini
      </Title>
      <Stack gap="xs">
        {(Object.keys(TASK_LABEL) as (keyof MentorTasks)[]).map((k) => (
          <Group key={k} gap="sm" wrap="nowrap">
            <ThemeIcon
              size={26}
              radius="xl"
              variant={tasks[k] ? "filled" : "light"}
              color={tasks[k] ? "teal" : "gray"}
            >
              {tasks[k] ? (
                <IconCircleCheck size={16} />
              ) : (
                <IconCircleDashed size={16} />
              )}
            </ThemeIcon>
            <Text size="sm">
              <Text span fw={700}>
                {k.toUpperCase()}
              </Text>{" "}
              · {TASK_LABEL[k]}
            </Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

export function CurriculumCard({ curriculum }: { curriculum: CurriculumItem }) {
  return (
    <Paper
      p="md"
      bg="var(--mantine-color-blue-0)"
      style={{ borderColor: "var(--mantine-color-blue-2)" }}
    >
      <Group gap="xs" mb={4}>
        <IconBook2 size={18} color="var(--mantine-color-blue-8)" />
        <Text size="xs" fw={700} c="blue.8">
          Materi bulan ini · Tingkat {curriculum.tingkat}
        </Text>
      </Group>
      <Title order={3}>{curriculum.theme}</Title>
      <Text size="sm" mt={4}>
        {curriculum.goal}
      </Text>
      <List size="sm" mt="xs" spacing={2}>
        {curriculum.flow.map((f) => (
          <List.Item key={f}>{f}</List.Item>
        ))}
      </List>
      <Text size="sm" mt="xs">
        <Text span fw={600}>
          Output:
        </Text>{" "}
        {curriculum.output}
      </Text>
      <Anchor
        href={curriculum.sheetUrl}
        target="_blank"
        size="sm"
        fw={700}
        mt="xs"
        display="inline-block"
      >
        Buka Lembar Mentor
      </Anchor>
    </Paper>
  );
}

export function ReviewCard({
  report,
  unread,
}: {
  report: SessionReport;
  unread: boolean;
}) {
  const r = report.review!;
  const returned = report.status === "returned";
  return (
    <Paper
      p="md"
      style={{
        borderColor: returned
          ? "var(--mantine-color-orange-4)"
          : "var(--mantine-color-teal-4)",
        background: returned
          ? "var(--mantine-color-orange-0)"
          : "var(--mantine-color-teal-0)",
      }}
    >
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Group gap={6}>
          <IconMessage2 size={18} />
          <Title order={3}>
            {returned ? "Dikembalikan koordinator" : "Tanggapan koordinator"}
          </Title>
        </Group>
        {unread && <NewBadge />}
      </Group>
      <Text size="xs" c="dimmed" mb="sm">
        {r.reviewedBy}
        {r.reviewerKind === "admin"
          ? " (pengelola, atas nama koordinator)"
          : ""}{" "}
        · {fmtDateTime(r.reviewedAt)}
      </Text>
      <Text size="xs" fw={700} c="dimmed" mb={4}>
        Apresiasi
      </Text>
      <MultilineText size="sm" mb="xs">
        {r.appreciation}
      </MultilineText>
      <Text size="xs" fw={700} c="dimmed" mb={4}>
        Catatan
      </Text>
      <MultilineText size="sm">{r.note}</MultilineText>
    </Paper>
  );
}

export function ReportSummary({ detail }: { detail: ReportDetail }) {
  const r = detail.report!;
  return (
    <Paper p="lg">
      <Title order={3} mb="sm">
        Berita acara sesi
      </Title>
      <KeyValue
        items={[
          [
            "Tanggal",
            r.sessionDate ? fmtDate(r.sessionDate, "dddd, D MMMM YYYY") : null,
          ],
          ["Mode", r.mode === "luring" ? "Luring" : "Daring"],
          [r.mode === "luring" ? "Tempat" : "Tautan", r.locationOrLink || null],
          [
            "Tema",
            r.deviationReason
              ? `Menyimpang dari kurikulum: ${r.deviationReason}`
              : detail.curriculum.theme,
          ],
          [
            "Diajukan",
            r.submittedAt
              ? `${fmtDateTime(r.submittedAt)}${r.isLate ? " · terlambat" : ""}`
              : "Belum",
          ],
          ["Diverifikasi", r.verifiedAt ? fmtDateTime(r.verifiedAt) : "Belum"],
        ]}
      />
      <Text size="xs" fw={700} c="dimmed" mt="md" mb={2}>
        Catatan jalannya sesi
      </Text>
      <MultilineText size="sm">{r.summary}</MultilineText>
      <Text size="xs" fw={700} c="dimmed" mt="md" mb={6}>
        Foto kelompok
      </Text>
      <FileList files={r.photos} />
      <Group
        gap={6}
        mt="md"
        c={r.hasCase ? "orange.8" : "dimmed"}
        wrap="nowrap"
        align="flex-start"
      >
        <IconShieldLock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        {r.caseNote ? (
          <div>
            <Text size="sm" fw={600}>
              Kasus diteruskan ke pengelola
              {r.caseStatus === "resolved" ? " · selesai" : ""}
            </Text>
            <MultilineText size="sm" c="var(--mantine-color-text)">
              {r.caseNote}
            </MultilineText>
          </div>
        ) : (
          <Text size="sm">
            {r.hasCase
              ? "Ada kasus · diteruskan ke pengelola (isi hanya untuk pengelola)"
              : "Tidak ada kasus"}
          </Text>
        )}
      </Group>
    </Paper>
  );
}
