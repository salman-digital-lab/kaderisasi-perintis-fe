import {
  ActionIcon,
  Alert,
  Button,
  FileButton,
  Group,
  Image,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconCamera, IconPhoto, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { participantApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import type { ReportDetail, SaveReportInput, UploadedFile } from "@/api/types";
import { useMe } from "@/auth/AuthProvider";
import { Screen } from "@/components/layout/Screen";
import { Loadable, StatusBadge } from "@/components/ui";
import { REPORT_STATUS } from "@/content/labels";
import { MAX_LONG } from "@/content/lapbulForm";
import { toPayload } from "@/lib/files";
import {
  deadlines,
  fmtDate,
  monthLabel,
  monthStart,
  now,
  relativeDays,
} from "@/lib/time";
import {
  CurriculumCard,
  ReportSummary,
  ReviewCard,
  TasksChecklist,
} from "@/features/shared/ReportParts";

function ReportForm({ detail }: { detail: ReportDetail }) {
  const queryClient = useQueryClient();
  const r = detail.report;
  const [form, setForm] = useState<SaveReportInput>({
    sessionDate: r?.sessionDate ?? null,
    mode: r?.mode ?? "luring",
    locationOrLink: r?.locationOrLink ?? "",
    followsCurriculum: !r?.deviationReason,
    deviationReason: r?.deviationReason ?? "",
    summary: r?.summary ?? "",
    photos: r?.photos ?? [],
    caseNote: r?.caseNote ?? "",
  });
  const set = (patch: Partial<SaveReportInput>) =>
    setForm((f) => ({ ...f, ...patch }));
  const month = detail.month;
  const due = deadlines(month).reportDue;
  const minDate = monthStart(month).format("YYYY-MM-DD");
  const maxDate = monthStart(month).endOf("month").format("YYYY-MM-DD");

  const onSaved = (next: ReportDetail) => {
    queryClient.setQueryData(["p", "report", month], next);
    queryClient.invalidateQueries({ queryKey: ["p", "my-reports"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const save = useMutation({
    mutationFn: () => participantApi.saveReport(month, form),
    onSuccess: (next) => {
      onSaved(next);
      notifications.show({ color: "teal", message: "Draf laporan tersimpan." });
    },
    onError: (e) =>
      notifications.show({ color: "red", message: errorMessage(e) }),
  });
  const submit = useMutation({
    mutationFn: async () => {
      await participantApi.saveReport(month, form);
      return participantApi.submitReport(month);
    },
    onSuccess: (next) => {
      onSaved(next);
      notifications.show({
        color: "teal",
        message: "Laporan diajukan ke koordinator.",
      });
    },
    onError: (e) =>
      notifications.show({
        color: "red",
        title: "Belum bisa diajukan",
        message: errorMessage(e),
      }),
  });
  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const uploaded: UploadedFile[] = [];
      for (const f of files)
        uploaded.push(await participantApi.uploadPhoto(await toPayload(f)));
      return uploaded;
    },
    onSuccess: (uploaded) =>
      setForm((f) => ({ ...f, photos: [...f.photos, ...uploaded] })),
    onError: (e) =>
      notifications.show({
        color: "red",
        title: "Unggah gagal",
        message: errorMessage(e),
      }),
  });

  const ready =
    !!form.sessionDate &&
    form.photos.length > 0 &&
    !!form.summary.trim() &&
    !!form.locationOrLink.trim();

  return (
    <Stack gap="md">
      <Paper p="md">
        <Title order={3} mb="sm">
          Berita acara sesi
        </Title>
        <Stack gap="md">
          <TextInput
            type="date"
            label="Tanggal sesi"
            min={minDate}
            max={maxDate}
            value={form.sessionDate ?? ""}
            onChange={(e) =>
              set({ sessionDate: e.currentTarget.value || null })
            }
          />
          <div>
            <Text size="sm" fw={500} mb={6}>
              Mode
            </Text>
            <SegmentedControl
              fullWidth
              value={form.mode}
              onChange={(v) => set({ mode: v as "luring" | "daring" })}
              data={[
                { value: "luring", label: "Luring" },
                { value: "daring", label: "Daring" },
              ]}
            />
          </div>
          <TextInput
            label={form.mode === "luring" ? "Tempat" : "Tautan pertemuan"}
            placeholder={
              form.mode === "luring"
                ? "mis. Selasar Masjid Salman ITB"
                : "https://meet.google.com/…"
            }
            type={form.mode === "luring" ? "text" : "url"}
            autoCapitalize={form.mode === "luring" ? "sentences" : "none"}
            value={form.locationOrLink}
            onChange={(e) => set({ locationOrLink: e.currentTarget.value })}
          />
          <Switch
            checked={form.followsCurriculum}
            onChange={(e) =>
              set({ followsCurriculum: e.currentTarget.checked })
            }
            label={`Tema sesuai kurikulum: ${detail.curriculum.theme}`}
          />
          {!form.followsCurriculum && (
            <Textarea
              label="Tema yang dibawakan & alasan menyimpang"
              value={form.deviationReason ?? ""}
              maxLength={500}
              onChange={(e) => set({ deviationReason: e.currentTarget.value })}
            />
          )}
          <Textarea
            label="Catatan jalannya sesi"
            description="Maksimal 5 kalimat."
            minRows={4}
            maxLength={MAX_LONG}
            value={form.summary}
            onChange={(e) => set({ summary: e.currentTarget.value })}
          />
        </Stack>
      </Paper>
      <Paper p="md">
        <Title order={3}>Foto kelompok</Title>
        <Text size="sm" c="dimmed" mb="sm">
          Minimal 1 foto. Sesi daring: tangkapan layar yang memperlihatkan
          peserta. Hanya untuk bukti, tidak dipublikasikan.
        </Text>
        <SimpleGrid cols={3} spacing="xs" mb="sm">
          {form.photos.map((p) => (
            <div key={p.key} style={{ position: "relative" }}>
              {p.previewUrl ? (
                <Image
                  src={p.previewUrl}
                  alt={p.name}
                  h={96}
                  radius="sm"
                  fit="cover"
                />
              ) : (
                <Paper
                  h={96}
                  bg="var(--surface-subtle)"
                  style={{ display: "grid", placeItems: "center" }}
                >
                  <IconPhoto size={28} color="var(--mantine-color-gray-6)" />
                </Paper>
              )}
              <ActionIcon
                size={28}
                radius="xl"
                color="dark"
                variant="filled"
                style={{ position: "absolute", top: 4, right: 4 }}
                aria-label={`Hapus ${p.name}`}
                onClick={() =>
                  set({ photos: form.photos.filter((x) => x.key !== p.key) })
                }
              >
                <IconX size={14} />
              </ActionIcon>
            </div>
          ))}
        </SimpleGrid>
        <FileButton
          multiple
          accept="image/*"
          onChange={(files) => files.length && upload.mutate(files)}
        >
          {(props) => (
            <Button
              {...props}
              variant="light"
              leftSection={<IconCamera size={18} />}
              loading={upload.isPending}
              fullWidth
            >
              Tambah foto
            </Button>
          )}
        </FileButton>
      </Paper>
      <Paper p="md">
        <Title order={3}>Kasus untuk eskalasi</Title>
        <Text size="sm" c="dimmed" mb="sm">
          Opsional. Isinya hanya terlihat pengelola dan masuk daftar Perlu
          tindak lanjut; koordinator hanya melihat bahwa ada kasus.
        </Text>
        <Textarea
          aria-label="Kasus untuk eskalasi"
          placeholder="Uraian singkat"
          minRows={2}
          maxLength={MAX_LONG}
          value={form.caseNote ?? ""}
          onChange={(e) => set({ caseNote: e.currentTarget.value })}
        />
      </Paper>
      <Text size="xs" c="dimmed" ta="center">
        {now().isAfter(due)
          ? "Tenggat tanggal 12 sudah lewat; laporan akan ditandai Terlambat."
          : `Tenggat ${fmtDate(due, "D MMMM")} (${relativeDays(due)}).`}
      </Text>
      <Group grow>
        <Button
          variant="default"
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          Simpan draf
        </Button>
        <Button
          disabled={!ready}
          loading={submit.isPending}
          onClick={() =>
            modals.openConfirmModal({
              title: "Ajukan laporan?",
              centered: true,
              children: (
                <Text size="sm">
                  Koordinator akan memeriksa dan memverifikasi laporan ini.
                </Text>
              ),
              labels: { confirm: "Ajukan", cancel: "Batal" },
              onConfirm: () => submit.mutate(),
            })
          }
        >
          Ajukan
        </Button>
      </Group>
      {!ready && (
        <Text size="xs" c="dimmed" ta="center">
          Ajukan aktif setelah tanggal, tempat/tautan, catatan, dan minimal satu
          foto terisi.
        </Text>
      )}
    </Stack>
  );
}

/** Shows the koordinator's latest review and marks it read once opened. */
function ReviewSection({ detail }: { detail: ReportDetail }) {
  const queryClient = useQueryClient();
  const [wasUnread] = useState(!detail.report!.review!.readAt);
  const month = detail.month;
  useEffect(() => {
    if (!wasUnread) return;
    participantApi.markReviewRead(month).then(() => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["p", "my-reports"] });
    });
  }, [wasUnread, month, queryClient]);
  return <ReviewCard report={detail.report!} unread={wasUnread} />;
}

export function ReportPage() {
  const { month = "" } = useParams();
  const me = useMe();
  const query = useQuery({
    queryKey: ["p", "report", month],
    queryFn: () => participantApi.report(me.profile.userId, month),
  });

  return (
    <Screen
      title={`Laporan ${monthLabel(month)}`}
      subtitle="Laporan mentoring"
      back="/laporan"
    >
      <Loadable query={query}>
        {(d) => (
          <Stack gap="md">
            <Group justify="space-between">
              <StatusBadge
                {...REPORT_STATUS[d.report?.status ?? "not_started"]}
              />
              <Text size="xs" c="dimmed">
                Koordinator: {d.coordinator?.name ?? "—"}
              </Text>
            </Group>
            {d.report?.review && <ReviewSection detail={d} />}
            {d.unrespondedJournals > 0 && (
              <Alert color="yellow" variant="light">
                {d.unrespondedJournals} lapbul terkirim belum ditanggapi.
                Koordinator tidak bisa memverifikasi sebelum semuanya
                ditanggapi.
              </Alert>
            )}
            <TasksChecklist tasks={d.tasks} />
            <CurriculumCard curriculum={d.curriculum} />
            {d.canEdit ? (
              <ReportForm key={d.report?.id ?? "new"} detail={d} />
            ) : (
              d.report && <ReportSummary detail={d} />
            )}
          </Stack>
        )}
      </Loadable>
    </Screen>
  );
}
