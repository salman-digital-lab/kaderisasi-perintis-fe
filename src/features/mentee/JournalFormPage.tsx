import {
  Alert,
  Button,
  Checkbox,
  Chip,
  FileButton,
  Group,
  List,
  NumberInput,
  Paper,
  Progress,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconLock,
  IconAlertTriangle,
  IconCheck,
  IconCloudCheck,
  IconPaperclip,
  IconPencil,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate, useParams } from "react-router";
import { participantApi } from "@/api/endpoints";
import { ApiError, errorMessage } from "@/api/errors";
import type {
  Journal,
  JournalAnswers,
  JournalDetail,
  Pulse,
  TargetResult,
} from "@/api/types";
import { useMe } from "@/auth/AuthProvider";
import { Screen } from "@/components/layout/Screen";
import { KeyValue, Loadable, MultilineText, Note } from "@/components/ui";
import { CATEGORY_LABEL } from "@/content/labels";
import {
  allMissing,
  estimatedMinutes,
  flagTrigger,
  LIVING_COST_USES,
  MAX_LONG,
  MAX_SHORT,
  missingFor,
  PULSE_ITEMS,
  SHARING_KINDS,
  stepsFor,
  TARGET_RESULTS,
  type FormState,
  type StepKey,
} from "@/content/lapbulForm";
import { formatSize, toPayload } from "@/lib/files";
import { fmtDate, fmtDateTime, monthLabel, now } from "@/lib/time";
import { JournalContent } from "@/features/shared/JournalContent";

const AUTOSAVE_MS = 10_000;

function backupKey(userId: number, month: string) {
  return `perintis.draft.${userId}.${month}`;
}

function initialState(detail: JournalDetail): FormState {
  const j = detail.journal;
  return {
    answers: { targets: ["", "", ""], ...(j?.answers ?? {}) },
    pulse: j?.pulse ?? {
      energy: null,
      academic: null,
      finance: null,
      relation: null,
    },
    wantsContact: j?.wantsContact ?? false,
    files: j?.files ?? [],
  };
}

function PulseInput({
  value,
  onChange,
}: {
  value: Pulse;
  onChange: (p: Pulse) => void;
}) {
  return (
    <Stack gap="md">
      {PULSE_ITEMS.map((item) => (
        <div key={item.key}>
          <Group justify="space-between" mb={8}>
            <Text size="sm" fw={500}>
              {item.label}
            </Text>
            <Text size="xs" c="dimmed">
              1 berat · 5 baik
            </Text>
          </Group>
          <SegmentedControl
            fullWidth
            value={value[item.key] == null ? "" : String(value[item.key])}
            onChange={(v) => onChange({ ...value, [item.key]: Number(v) })}
            data={["1", "2", "3", "4", "5"]}
            aria-label={item.label}
            color={
              value[item.key] == null
                ? "gray"
                : value[item.key]! <= 2
                  ? "red"
                  : value[item.key] === 3
                    ? "yellow"
                    : "teal"
            }
          />
        </div>
      ))}
    </Stack>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Text fw={600} mb={hint ? 2 : 10}>
        {label}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed" mb={12}>
          {hint}
        </Text>
      )}
      {children}
    </div>
  );
}

function Wizard({ detail }: { detail: JournalDetail }) {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { month } = detail;
  const steps = useMemo(
    () => stepsFor(detail.category, month),
    [detail.category, month],
  );
  const isRevision = detail.journal?.status === "revision_requested";

  const [honesty, setHonesty] = useState(!!detail.journal?.honestyConfirmedAt);
  const [started, setStarted] = useState(!!detail.journal?.honestyConfirmedAt);
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(() => {
    const base = initialState(detail);
    try {
      const raw = localStorage.getItem(backupKey(me.profile.userId, month));
      const backup = raw
        ? (JSON.parse(raw) as { revision: number; form: FormState })
        : null;
      if (backup && backup.revision === (detail.journal?.revision ?? 0))
        return { ...backup.form, files: base.files };
    } catch {
      // Ignore unreadable local drafts.
    }
    return base;
  });
  const [savedAt, setSavedAt] = useState<string | null>(
    detail.journal?.updatedAt ?? null,
  );
  const revision = useRef(detail.journal?.revision ?? 0);
  const dirty = useRef(false);
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const ctx = {
    category: detail.category,
    previousTargets: detail.previousTargets,
  };
  const step = steps[stepIndex];

  const update = (fn: (f: FormState) => FormState) => {
    setForm((f) => {
      const next = fn(f);
      try {
        localStorage.setItem(
          backupKey(me.profile.userId, month),
          JSON.stringify({ revision: revision.current, form: next }),
        );
      } catch {
        // Local backup is best effort.
      }
      return next;
    });
    dirty.current = true;
  };
  const setAnswers = (patch: Partial<JournalAnswers>) =>
    update((f) => ({ ...f, answers: { ...f.answers, ...patch } }));

  const applyDetail = useCallback(
    (next: JournalDetail) => {
      revision.current = next.journal?.revision ?? revision.current;
      setSavedAt(next.journal?.updatedAt ?? null);
      queryClient.setQueryData(["p", "journal", month], next);
    },
    [month, queryClient],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      participantApi.saveJournal(month, {
        revision: revision.current,
        answers: formRef.current.answers,
        pulse: formRef.current.pulse,
        wantsContact: formRef.current.wantsContact,
        honestyConfirmed: honesty,
      }),
    onSuccess: (next) => {
      dirty.current = false;
      applyDetail(next);
      try {
        localStorage.removeItem(backupKey(me.profile.userId, month));
      } catch {
        // ignore
      }
    },
    onError: (error) => {
      notifications.show({
        color:
          error instanceof ApiError && error.status === 409 ? "orange" : "red",
        title: "Draf belum tersimpan",
        message: `${errorMessage(error)} Isian tetap tersimpan di perangkat ini.`,
      });
    },
  });

  const { mutateAsync: saveAsync, isPending: saving } = saveMutation;
  const save = useCallback(
    async (force = false) => {
      if (!dirty.current && !force) return;
      await saveAsync();
    },
    [saveAsync],
  );

  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => {
      if (dirty.current && !saving) save().catch(() => {});
    }, AUTOSAVE_MS);
    return () => clearInterval(t);
  }, [started, save, saving]);

  const upload = useMutation({
    mutationFn: async ({
      field,
      files,
    }: {
      field: "s3b" | "s7khs";
      files: File[];
    }) => {
      let last: JournalDetail | null = null;
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024 && !file.type.startsWith("image/"))
          throw new ApiError(413, `${file.name}: ukuran maksimal 5 MB.`);
        last = await participantApi.uploadJournalFile(
          month,
          field,
          await toPayload(file),
        );
      }
      return last;
    },
    onSuccess: (next) => {
      if (!next?.journal) return;
      applyDetail(next);
      setForm((f) => ({ ...f, files: next.journal!.files }));
    },
    onError: (error) =>
      notifications.show({
        color: "red",
        title: "Unggah gagal",
        message: errorMessage(error),
      }),
  });

  const removeFile = useMutation({
    mutationFn: (key: string) => participantApi.deleteJournalFile(month, key),
    onSuccess: (next) => {
      applyDetail(next);
      setForm((f) => ({ ...f, files: next.journal?.files ?? [] }));
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      await save(true);
      return participantApi.submitJournal(month);
    },
    onSuccess: (next) => {
      queryClient.setQueryData(["p", "journal", month], next);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["p"] });
      notifications.show({
        color: "teal",
        icon: <IconCheck size={18} />,
        title: isRevision
          ? "Perbaikan terkirim"
          : "Catatan Perjalanan terkirim",
        message:
          next.journal?.flag?.status === "open"
            ? "Mentormu akan segera menghubungimu."
            : "Mentormu akan menanggapi paling lambat tanggal 12.",
      });
      navigate(`/lapbul/${month}`, { replace: true });
    },
    onError: (error) =>
      notifications.show({
        color: "red",
        title: "Belum terkirim",
        message: errorMessage(error),
      }),
  });

  const goTo = (to: number | ((current: number) => number)) => {
    save().catch(() => {});
    setStepIndex((current) => {
      const next = typeof to === "function" ? to(current) : to;
      return Math.min(steps.length - 1, Math.max(0, next));
    });
    window.scrollTo({ top: 0 });
  };

  const missing = allMissing(steps, form, ctx);
  const stepMissing = step ? missingFor(step.key, form, ctx) : [];
  const trigger = flagTrigger(form.pulse, form.wantsContact);

  const confirmSubmit = () =>
    modals.openConfirmModal({
      title: isRevision ? "Kirim perbaikan?" : "Kirim Catatan Perjalanan?",
      centered: true,
      children: (
        <Text size="sm">
          {isRevision
            ? "Isian lama akan diganti dengan perbaikan ini."
            : "Setelah terkirim, isian hanya bisa dibaca kecuali mentor meminta perbaikan."}
        </Text>
      ),
      labels: { confirm: "Kirim", cancel: "Periksa lagi" },
      onConfirm: () => submit.mutate(),
    });

  const title = `Lapbul ${monthLabel(month)}`;

  if (!started) {
    return (
      <Screen
        title={title}
        subtitle="Catatan Perjalanan"
        back={`/lapbul/${month}`}
        footer={
          <Button
            fullWidth
            disabled={!honesty}
            onClick={() => {
              setStarted(true);
              dirty.current = true;
              save(true).catch(() => {});
            }}
          >
            Mulai mengisi
          </Button>
        }
      >
        <Stack gap="lg">
          <Paper p="lg">
            <Title order={2} size="h3">
              Sebelum mulai
            </Title>
            <Text size="sm" mt="xs">
              Catatan Perjalanan dibaca dan dibalas mentormu. Isian disimpan
              otomatis tiap pindah bagian dan tiap 10 detik, jadi bisa
              dilanjutkan dari perangkat lain.
            </Text>
            <KeyValue
              items={[
                ["Kategori", CATEGORY_LABEL[detail.category]],
                [
                  "Perkiraan waktu",
                  `± ${estimatedMinutes(detail.category)} menit`,
                ],
                ["Jumlah bagian", `${steps.length - 1} bagian + tinjau`],
              ]}
            />
          </Paper>
          <Paper p="lg">
            <Checkbox
              checked={honesty}
              onChange={(e) => setHonesty(e.currentTarget.checked)}
              label="Saya akan mengisi laporan ini dengan jujur."
              description="Wajib dicentang untuk membuka formulir."
            />
          </Paper>
        </Stack>
      </Screen>
    );
  }

  const fileList = (field: "s3b" | "s7khs") => {
    const files = form.files.filter((f) => f.field === field);
    return (
      <Stack gap="xs">
        {files.map((f) => (
          <Paper key={f.key} p="xs" bg="var(--surface-subtle)">
            <Group wrap="nowrap" gap="xs">
              <IconPaperclip size={18} />
              <Text size="sm" style={{ flex: 1, minWidth: 0 }} truncate>
                {f.name}
              </Text>
              <Text size="xs" c="dimmed">
                {formatSize(f.size)}
              </Text>
              <Button
                variant="subtle"
                color="red"
                size="compact-sm"
                aria-label={`Hapus ${f.name}`}
                loading={removeFile.isPending && removeFile.variables === f.key}
                onClick={() => removeFile.mutate(f.key)}
              >
                <IconTrash size={16} />
              </Button>
            </Group>
          </Paper>
        ))}
        <FileButton
          multiple={field === "s3b"}
          accept="image/*,application/pdf"
          onChange={(files) => {
            const list = Array.isArray(files) ? files : files ? [files] : [];
            if (list.length) upload.mutate({ field, files: list });
          }}
        >
          {(props) => (
            <Button
              {...props}
              variant="light"
              leftSection={<IconUpload size={18} />}
              loading={upload.isPending && upload.variables?.field === field}
            >
              {field === "s3b" ? "Unggah foto/PDF" : "Unggah KHS"}
            </Button>
          )}
        </FileButton>
        <Text size="xs" c="dimmed">
          Foto atau PDF, maksimal 5 MB. Foto dikompresi otomatis.
        </Text>
      </Stack>
    );
  };

  const a = form.answers;
  const targets = a.targets ?? ["", "", ""];

  const body: Record<StepKey, () => ReactNode> = {
    auto: () => (
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Data ini diambil dari sistem, tidak perlu diketik ulang. Data keliru?
          Sampaikan ke mentor.
        </Text>
        <Paper p="lg">
          <KeyValue
            items={[
              ["Nama", detail.autoData.name],
              ["NIM", detail.autoData.nim],
              [
                "Kampus",
                `${detail.autoData.university} · ${detail.autoData.major}`,
              ],
              [
                "Tingkat",
                `${detail.autoData.tingkat} (angkatan ${detail.autoData.intakeYear})`,
              ],
              ["Kategori", CATEGORY_LABEL[detail.autoData.category]],
              ["Mentor", detail.autoData.mentorName],
              ["Koordinator", detail.autoData.coordinatorName],
              ["Bulan", monthLabel(month)],
              [
                "Sesi kelompok",
                detail.autoData.session
                  ? `${fmtDate(detail.autoData.session.date, "D MMM")} · ${detail.autoData.session.theme}`
                  : "Belum dilaporkan mentor",
              ],
              [
                "Kegiatan bulan ini",
                detail.autoData.activities.length
                  ? detail.autoData.activities.join("\n")
                  : "Tidak ada",
              ],
              [
                "SSC / LMD",
                `${detail.autoData.sscStatus} · ${detail.autoData.lmdStatus}`,
              ],
              [
                "Unit/club",
                detail.autoData.clubs.join(", ") || "Belum terdaftar",
              ],
            ]}
          />
        </Paper>
      </Stack>
    ),
    kabar: () => (
      <Stack gap="md" className="formStep">
        <Field
          label="1a · Pulse bulan ini"
          hint="Seberapa baik kondisimu di tiap bidang?"
        >
          <PulseInput
            value={form.pulse}
            onChange={(pulse) => update((f) => ({ ...f, pulse }))}
          />
        </Field>
        <Textarea
          label="1b · Satu kalimat tentang bulan ini"
          value={a.s1b ?? ""}
          maxLength={MAX_SHORT}
          onChange={(e) => setAnswers({ s1b: e.currentTarget.value })}
        />
        <Textarea
          label="1c · Kabar keluarga bulan ini"
          value={a.s1c ?? ""}
          maxLength={MAX_SHORT}
          onChange={(e) => setAnswers({ s1c: e.currentTarget.value })}
        />
        <Textarea
          label="1d · Kendala yang sedang dihadapi"
          description="Boleh kosong"
          value={a.s1d ?? ""}
          maxLength={MAX_LONG}
          minRows={3}
          onChange={(e) => setAnswers({ s1d: e.currentTarget.value })}
        />
        <Checkbox
          checked={form.wantsContact}
          onChange={(e) => {
            const checked = e.currentTarget.checked;
            update((f) => ({ ...f, wantsContact: checked }));
          }}
          label="1e · Saya ingin dihubungi mentor/pengelola secara pribadi"
        />
        {trigger && (
          <Alert
            color="teal"
            variant="light"
            icon={<IconAlertTriangle size={18} />}
          >
            Setelah kamu kirim, mentormu akan diminta menghubungimu dalam 3
            hari.
          </Alert>
        )}
      </Stack>
    ),
    target: () => (
      <Stack gap="md" className="formStep">
        {detail.previousTargets ? (
          <Field label="2a · Status tiga target bulan lalu">
            <Stack gap="sm">
              {detail.previousTargets.map((t, i) => (
                <Paper key={i} p="sm" bg="var(--surface-subtle)">
                  <Text size="sm" className="multiline" mb="xs">
                    {t}
                  </Text>
                  <Chip.Group
                    value={a.s2a?.[i] ?? ""}
                    onChange={(v) => {
                      const next = [...(a.s2a ?? [])];
                      next[i] = v as TargetResult;
                      setAnswers({ s2a: next });
                    }}
                  >
                    <Group gap={6}>
                      {TARGET_RESULTS.map((r) => (
                        <Chip key={r.value} value={r.value} size="sm">
                          {r.label}
                        </Chip>
                      ))}
                    </Group>
                  </Chip.Group>
                </Paper>
              ))}
            </Stack>
          </Field>
        ) : (
          <Text size="sm" c="dimmed">
            2a dilewati: belum ada target bulan lalu.
          </Text>
        )}
        <Textarea
          label="2b · Apa yang paling membantu atau menghambat?"
          value={a.s2b ?? ""}
          maxLength={MAX_LONG}
          onChange={(e) => setAnswers({ s2b: e.currentTarget.value })}
        />
        <Field
          label="2c · Tiga target bulan depan"
          hint="Pola “Jika … maka saya …” yang bisa dicek."
        >
          <Stack gap="sm">
            {[0, 1, 2].map((i) => (
              <Textarea
                key={i}
                aria-label={`Target ${i + 1}`}
                placeholder="Jika … maka saya …"
                leftSection={
                  <Text size="sm" fw={700}>
                    {i + 1}
                  </Text>
                }
                value={targets[i] ?? ""}
                maxLength={MAX_SHORT}
                onChange={(e) => {
                  const next = [...targets];
                  next[i] = e.currentTarget.value;
                  setAnswers({ targets: next });
                }}
              />
            ))}
          </Stack>
        </Field>
      </Stack>
    ),
    insight: () => (
      <Stack gap="md" className="formStep">
        <Textarea
          label="3a · Insight terbesar bulan ini"
          description="2–4 kalimat: dari mentoring, kegiatan, kuliah, atau organisasi."
          minRows={4}
          value={a.s3a ?? ""}
          maxLength={MAX_LONG}
          onChange={(e) => setAnswers({ s3a: e.currentTarget.value })}
        />
        <Field label="3b · Bukti hasil praktik sesi bulan ini" hint="Opsional">
          {fileList("s3b")}
        </Field>
      </Stack>
    ),
    ruhiyah: () => (
      <Stack gap="md" className="formStep">
        <NumberInput
          label="5a · Tilawah/bacaan kitab suci bulan ini (halaman)"
          min={0}
          max={9999}
          value={a.s5aPages ?? ""}
          onChange={(v) =>
            setAnswers({ s5aPages: v === "" ? null : Number(v) })
          }
        />
        <Textarea
          label="Ayat atau pesan yang paling berkesan & alasannya"
          minRows={3}
          value={a.s5aVerse ?? ""}
          maxLength={MAX_LONG}
          onChange={(e) => setAnswers({ s5aVerse: e.currentTarget.value })}
        />
        <Textarea
          label="5b · Satu amalan yang kamu jaga konsisten"
          value={a.s5b ?? ""}
          maxLength={MAX_SHORT}
          onChange={(e) => setAnswers({ s5b: e.currentTarget.value })}
        />
        <Field label="5c · Bentuk berbagi bulan ini">
          <Chip.Group
            multiple
            value={a.s5cKinds ?? []}
            onChange={(v) => setAnswers({ s5cKinds: v })}
          >
            <Group gap={6} mb="sm">
              {SHARING_KINDS.map((k) => (
                <Chip key={k} value={k} size="sm">
                  {k}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
          <Textarea
            aria-label="Cerita singkat berbagi"
            placeholder="Ceritakan singkat (opsional)"
            value={a.s5cText ?? ""}
            maxLength={MAX_SHORT}
            onChange={(e) => setAnswers({ s5cText: e.currentTarget.value })}
          />
        </Field>
        <NumberInput
          label="5d · Hafalan (jumlah surat)"
          description="Opsional · boleh dilewati"
          min={0}
          max={114}
          value={a.s5d ?? ""}
          onChange={(v) => setAnswers({ s5d: v === "" ? null : Number(v) })}
        />
      </Stack>
    ),
    ukhuwah: () => (
      <Stack className="formStep">
        <Textarea
          label="6 · Satu teman Perintis yang baru kamu kenal atau makin dekat, dan satu hal yang kamu pelajari darinya"
          minRows={3}
          value={a.s6 ?? ""}
          maxLength={MAX_LONG}
          onChange={(e) => setAnswers({ s6: e.currentTarget.value })}
        />
      </Stack>
    ),
    nilai: () => (
      <Stack gap="md" className="formStep">
        <NumberInput
          label="7 · IP semester"
          inputMode="decimal"
          decimalScale={2}
          min={0}
          max={4}
          step={0.01}
          value={a.s7ip ?? ""}
          onChange={(v) => setAnswers({ s7ip: v === "" ? null : Number(v) })}
        />
        <Field label="Unggah KHS">{fileList("s7khs")}</Field>
      </Stack>
    ),
    ekonomi: () => (
      <Stack gap="md" className="formStep">
        <Field label="8a · Apakah kondisi ekonomi keluarga atau kebutuhan biaya hidupmu berubah bulan ini?">
          <SegmentedControl
            fullWidth
            value={a.s8aChanged == null ? "" : a.s8aChanged ? "ya" : "tidak"}
            onChange={(v) => setAnswers({ s8aChanged: v === "ya" })}
            data={[
              { value: "tidak", label: "Tidak" },
              { value: "ya", label: "Ya" },
            ]}
          />
        </Field>
        {a.s8aChanged && (
          <Textarea
            label="Jelaskan perubahannya"
            description="Boleh beberapa baris"
            minRows={3}
            value={a.s8aText ?? ""}
            maxLength={MAX_LONG}
            onChange={(e) => setAnswers({ s8aText: e.currentTarget.value })}
          />
        )}
        <Field label="8b · Bantuan biaya hidup terutama terpakai untuk">
          <Checkbox.Group
            value={a.s8b ?? []}
            onChange={(v) => setAnswers({ s8b: v })}
          >
            <Stack gap="xs">
              {LIVING_COST_USES.map((u) => (
                <Checkbox key={u} value={u} label={u} />
              ))}
            </Stack>
          </Checkbox.Group>
        </Field>
      </Stack>
    ),
    tinjau: () => {
      const preview: Journal = {
        ...(detail.journal as Journal),
        month,
        category: detail.category,
        answers: form.answers,
        pulse: form.pulse,
        wantsContact: form.wantsContact,
        files: form.files,
      };
      return (
        <Stack gap="lg">
          {missing.length ? (
            <Alert color="yellow" variant="light" title="Masih ada isian wajib">
              <Stack gap="xs">
                {missing.map((m) => (
                  <UnstyledButton
                    key={m.step.key}
                    onClick={() => goTo(steps.indexOf(m.step))}
                  >
                    <Text size="sm" fw={700} c="orange.9">
                      {m.step.section} · {m.step.title} <IconPencil size={14} />
                    </Text>
                    <List size="sm">
                      {m.items.map((i) => (
                        <List.Item key={i}>{i}</List.Item>
                      ))}
                    </List>
                  </UnstyledButton>
                ))}
              </Stack>
            </Alert>
          ) : (
            <Alert color="teal" variant="light" icon={<IconCheck size={18} />}>
              Semua isian wajib sudah lengkap. Periksa sekali lagi lalu kirim.
            </Alert>
          )}
          {detail.window === "late" && !isRevision && (
            <Alert color="yellow" variant="light">
              Tenggat tanggal 5 sudah lewat; kiriman akan ditandai Terlambat.
            </Alert>
          )}
          <JournalContent
            journal={preview}
            previousTargets={detail.previousTargets}
          />
        </Stack>
      );
    },
  };

  const isLast = stepIndex === steps.length - 1;

  return (
    <Screen
      title={title}
      subtitle="Catatan Perjalanan"
      back={`/lapbul/${month}`}
      footer={
        <Group grow gap="sm">
          {stepIndex > 0 && (
            <Button variant="default" onClick={() => goTo((i) => i - 1)}>
              Kembali
            </Button>
          )}
          {isLast ? (
            <Button
              disabled={missing.length > 0}
              loading={submit.isPending}
              onClick={confirmSubmit}
            >
              {isRevision ? "Kirim perbaikan" : "Kirim"}
            </Button>
          ) : (
            <Button onClick={() => goTo((i) => i + 1)}>Lanjut</Button>
          )}
        </Group>
      }
    >
      <Stack gap="lg">
        <div>
          <Group justify="space-between" mb={6}>
            <Text size="xs" c="dimmed" fw={600}>
              Langkah {stepIndex + 1} dari {steps.length}
            </Text>
            <Group gap={4} c="dimmed" wrap="nowrap">
              <IconCloudCheck size={14} />
              <Text size="xs" fw={600}>
                {saving
                  ? "Menyimpan…"
                  : savedAt
                    ? `Tersimpan ${fmtDateTime(savedAt).split(", ")[1] ?? ""}`
                    : "Draf"}
              </Text>
            </Group>
          </Group>
          <Progress
            value={((stepIndex + 1) / steps.length) * 100}
            size="sm"
            radius="xl"
          />
        </div>
        {isRevision && detail.journal?.response?.revisionRequest && (
          <Alert
            color="yellow"
            variant="light"
            icon={<IconPencil size={18} />}
            title="Permintaan perbaikan mentor"
          >
            <MultilineText size="sm">
              {detail.journal.response.revisionRequest}
            </MultilineText>
          </Alert>
        )}
        <div>
          <Title order={2} size="h3">
            {step.title}
          </Title>
          {stepMissing.length > 0 && step.key !== "tinjau" && (
            <Text size="xs" c="orange.8" fw={600} mt={4}>
              {stepMissing.length} isian wajib belum terisi
            </Text>
          )}
        </div>
        {body[step.key]()}
      </Stack>
    </Screen>
  );
}

export function JournalFormPage() {
  const { month = "" } = useParams();
  const query = useQuery({
    queryKey: ["p", "journal", month],
    queryFn: () => participantApi.myJournal(month),
    staleTime: 0,
  });
  if (query.isPending || query.isError)
    return (
      <Screen title={`Lapbul ${monthLabel(month)}`} back={`/lapbul/${month}`}>
        <Loadable query={query}>{() => null}</Loadable>
      </Screen>
    );
  return (
    <Loadable query={query}>
      {(d) =>
        d.canEdit ? (
          <Wizard key={`${month}-${now().format("YYYYMMDD")}`} detail={d} />
        ) : (
          <Screen
            title={`Lapbul ${monthLabel(month)}`}
            back={`/lapbul/${month}`}
          >
            <Stack>
              <Note icon={IconLock}>{d.lockedReason}</Note>
              <Button component={Link} to={`/lapbul/${month}`} variant="light">
                Lihat Catatan Perjalanan
              </Button>
            </Stack>
          </Screen>
        )
      }
    </Loadable>
  );
}
