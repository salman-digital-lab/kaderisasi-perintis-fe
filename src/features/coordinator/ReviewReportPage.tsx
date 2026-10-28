import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconArrowBackUp, IconCircleCheck } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router";
import { participantApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import type { ReportDetail, ReviewDecision } from "@/api/types";
import { Screen } from "@/components/layout/Screen";
import { EmptyState, Loadable, StatusBadge } from "@/components/ui";
import { REPORT_STATUS } from "@/content/labels";
import { MAX_LONG } from "@/content/lapbulForm";
import { deadlines, fmtDate, monthLabel } from "@/lib/time";
import {
  CurriculumCard,
  ReportSummary,
  ReviewCard,
  TasksChecklist,
} from "@/features/shared/ReportParts";

function ReviewForm({ detail }: { detail: ReportDetail }) {
  const queryClient = useQueryClient();
  const [appreciation, setAppreciation] = useState("");
  const [note, setNote] = useState("");
  const review = useMutation({
    mutationFn: (decision: ReviewDecision) =>
      participantApi.reviewReport(detail.report!.id, {
        decision,
        appreciation,
        note,
      }),
    onSuccess: (next, decision) => {
      queryClient.setQueryData(
        ["p", "review", String(detail.mentor.userId), detail.month],
        next,
      );
      queryClient.invalidateQueries({ queryKey: ["p", "coordinator"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      notifications.show({
        color: "teal",
        message:
          decision === "verify"
            ? "Laporan diverifikasi."
            : decision === "return"
              ? "Laporan dikembalikan ke mentor."
              : "Verifikasi dibatalkan.",
      });
    },
    onError: (e) =>
      notifications.show({
        color: "red",
        title: "Gagal",
        message: errorMessage(e),
      }),
  });
  const valid = appreciation.trim() && note.trim();
  return (
    <Paper p="md">
      <Title order={3} mb="xs">
        Tanggapan koordinator
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        Apresiasi dan catatan wajib untuk verifikasi maupun pengembalian. Hanya
        tanggapan terakhir yang disimpan.
      </Text>
      <Stack gap="sm">
        <Textarea
          label="Apresiasi"
          minRows={2}
          maxLength={MAX_LONG}
          value={appreciation}
          onChange={(e) => setAppreciation(e.currentTarget.value)}
        />
        <Textarea
          label="Catatan"
          minRows={3}
          maxLength={MAX_LONG}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
        />
        {detail.unrespondedJournals > 0 && (
          <Alert color="yellow" variant="light">
            Masih ada {detail.unrespondedJournals} lapbul terkirim yang belum
            ditanggapi mentor; verifikasi akan ditolak sistem.
          </Alert>
        )}
        <Group grow>
          <Button
            variant="light"
            color="orange"
            leftSection={<IconArrowBackUp size={18} />}
            disabled={!valid}
            loading={review.isPending && review.variables === "return"}
            onClick={() => review.mutate("return")}
          >
            Kembalikan
          </Button>
          <Button
            leftSection={<IconCircleCheck size={18} />}
            disabled={!valid}
            loading={review.isPending && review.variables === "verify"}
            onClick={() => review.mutate("verify")}
          >
            Verifikasi
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export function ReviewReportPage() {
  const { mentorId = "", month = "" } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["p", "review", mentorId, month],
    queryFn: () => participantApi.report(Number(mentorId), month),
  });
  const unverify = useMutation({
    mutationFn: (id: number) =>
      participantApi.reviewReport(id, {
        decision: "unverify",
        appreciation: "",
        note: "",
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(["p", "review", mentorId, month], next);
      queryClient.invalidateQueries({ queryKey: ["p", "coordinator"] });
      notifications.show({
        color: "teal",
        message: "Verifikasi dibatalkan. Laporan kembali menunggu verifikasi.",
      });
    },
    onError: (e) =>
      notifications.show({ color: "red", message: errorMessage(e) }),
  });

  return (
    <Screen
      title={query.data?.mentor.name ?? "Laporan mentor"}
      subtitle={`Laporan ${monthLabel(month)}`}
      back="/koordinator"
    >
      <Loadable query={query}>
        {(d) => (
          <Stack gap="md">
            <Group justify="space-between">
              <StatusBadge
                {...REPORT_STATUS[d.report?.status ?? "not_started"]}
              />
              {d.report?.isLate && (
                <StatusBadge label="Diajukan terlambat" tone="orange" />
              )}
            </Group>
            <TasksChecklist tasks={d.tasks} />
            {!d.report || d.report.status === "draft" ? (
              <EmptyState
                title="Laporan belum diajukan"
                description="Mentor belum mengajukan laporan bulan ini."
              />
            ) : (
              <>
                {d.report.review && (
                  <ReviewCard report={d.report} unread={false} />
                )}
                <ReportSummary detail={d} />
                {d.report.status === "submitted" && <ReviewForm detail={d} />}
                {d.canUnverify && (
                  <Button
                    variant="subtle"
                    color="gray"
                    loading={unverify.isPending}
                    onClick={() =>
                      modals.openConfirmModal({
                        title: "Batalkan verifikasi?",
                        centered: true,
                        children: (
                          <Text size="sm">
                            Bisa dilakukan sampai{" "}
                            {fmtDate(deadlines(month).unverifyUntil, "D MMMM")}.
                          </Text>
                        ),
                        labels: {
                          confirm: "Batalkan verifikasi",
                          cancel: "Tidak",
                        },
                        confirmProps: { color: "red" },
                        onConfirm: () => unverify.mutate(d.report!.id),
                      })
                    }
                  >
                    Batalkan verifikasi
                  </Button>
                )}
              </>
            )}
            <CurriculumCard curriculum={d.curriculum} />
          </Stack>
        )}
      </Loadable>
    </Screen>
  );
}
