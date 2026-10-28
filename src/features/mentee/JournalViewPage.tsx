import { Alert, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import {
  IconAlertTriangle,
  IconHeartHandshake,
  IconPencil,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { participantApi } from "@/api/endpoints";
import type { JournalDetail } from "@/api/types";
import { Screen } from "@/components/layout/Screen";
import {
  EmptyState,
  Loadable,
  MultilineText,
  NewBadge,
  StatusBadge,
} from "@/components/ui";
import { JOURNAL_STATUS } from "@/content/labels";
import { fmtDate, fmtDateTime, monthLabel, relativeDays } from "@/lib/time";
import { JournalContent } from "@/features/shared/JournalContent";

function ResponseCard({ detail }: { detail: JournalDetail }) {
  const r = detail.journal!.response!;
  const [wasUnread] = useState(!r.readAt);
  const queryClient = useQueryClient();
  const markRead = useMutation({
    mutationFn: () => participantApi.markResponseRead(detail.month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["p", "journals"] });
    },
  });
  const { mutate } = markRead;
  useEffect(() => {
    if (wasUnread) mutate();
  }, [wasUnread, mutate]);

  return (
    <Paper
      p="md"
      style={{
        borderColor: "var(--mantine-color-teal-4)",
        background: "var(--mantine-color-teal-0)",
      }}
    >
      <Group justify="space-between" wrap="nowrap" mb="xs">
        <Group gap={6}>
          <IconHeartHandshake size={20} color="var(--mantine-color-teal-8)" />
          <Title order={3}>Tanggapan mentor</Title>
        </Group>
        {wasUnread && <NewBadge />}
      </Group>
      <Text size="xs" c="dimmed" mb="sm">
        {r.respondedBy} · {fmtDateTime(r.respondedAt)}
      </Text>
      <Stack gap="sm">
        <div>
          <Text size="xs" fw={700} c="dimmed">
            Apresiasi
          </Text>
          <MultilineText size="sm">{r.appreciation}</MultilineText>
        </div>
        <div>
          <Text size="xs" fw={700} c="dimmed">
            Tanggapan
          </Text>
          <MultilineText size="sm">{r.text}</MultilineText>
        </div>
        {r.revisionRequest &&
          detail.journal!.status === "revision_requested" && (
            <Alert
              color="orange"
              variant="light"
              icon={<IconPencil size={18} />}
              title="Permintaan perbaikan"
            >
              <MultilineText size="sm">{r.revisionRequest}</MultilineText>
              {detail.revisionDueAt && (
                <Text size="xs" mt={6} fw={600}>
                  Batas perbaikan {fmtDate(detail.revisionDueAt, "D MMMM")} (
                  {relativeDays(detail.revisionDueAt)})
                </Text>
              )}
            </Alert>
          )}
        {detail.journal!.status === "flagged" && (
          <Text size="sm" c="dimmed">
            Mentor meneruskan catatanmu ke pengelola agar ada yang membantu
            menindaklanjuti.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

export function JournalViewPage() {
  const { month = "" } = useParams();
  const query = useQuery({
    queryKey: ["p", "journal", month],
    queryFn: () => participantApi.myJournal(month),
  });
  return (
    <Screen
      title={`Lapbul ${monthLabel(month)}`}
      subtitle="Catatan Perjalanan"
      back="/lapbul"
    >
      <Loadable query={query}>
        {(d) => {
          const j = d.journal;
          const status = j?.status ?? "not_started";
          const submitted = j && j.status !== "draft";
          return (
            <Stack gap="md">
              <Group justify="space-between">
                <StatusBadge {...JOURNAL_STATUS[status]} />
                {j?.submittedAt && (
                  <Text size="xs" c="dimmed">
                    Dikirim {fmtDateTime(j.submittedAt)}
                    {j.isLate ? " · terlambat" : ""}
                  </Text>
                )}
              </Group>
              {j?.response && <ResponseCard detail={d} />}
              {d.canEdit && (
                <Button
                  component={Link}
                  to={`/lapbul/${month}/isi`}
                  size="md"
                  fullWidth
                  leftSection={<IconPencil size={18} />}
                >
                  {status === "revision_requested"
                    ? "Perbaiki lapbul"
                    : j
                      ? "Lanjutkan draf"
                      : "Isi sekarang"}
                </Button>
              )}
              {!d.canEdit && !submitted && (
                <Alert
                  color="gray"
                  variant="light"
                  icon={<IconAlertTriangle size={18} />}
                >
                  {d.lockedReason}
                </Alert>
              )}
              {submitted && j ? (
                <JournalContent
                  journal={j}
                  previousTargets={d.previousTargets}
                />
              ) : (
                !d.canEdit && <EmptyState title="Belum ada isian" />
              )}
            </Stack>
          );
        }}
      </Loadable>
    </Screen>
  );
}
