import {
  Alert,
  Button,
  FileButton,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconEye, IconUpload } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { staffApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import type { ImportKind, ImportPreview } from "@/api/types";
import { Screen } from "@/components/layout/Screen";
import { StatusBadge } from "@/components/ui";
import { downloadCsv } from "@/lib/files";

const TEMPLATES: Record<ImportKind, { label: string; csv: string }> = {
  mentee: {
    label: "Mentee",
    csv: [
      "nim,nama,email,kategori,kip_k",
      "10525107,Aisyah Rahmawati,aisyah.rahmawati@gmail.com,biaya_hidup,ya",
      "16526001,Rafi Ananda,rafi.ananda@gmail.com,dasar,tidak",
      "16526002,Siti Marlina,siti.marlina@gmail.com,dasar,ya",
    ].join("\n"),
  },
  mentor: {
    label: "Mentor",
    csv: [
      "email,email_koordinator",
      "galih.permana@gmail.com,arif.budiman@gmail.com",
      "mentor.baru@gmail.com,hana.lestari@gmail.com",
    ].join("\n"),
  },
  matching: {
    label: "Pencocokan",
    csv: ["nim,email_mentor", "16526001,galih.permana@gmail.com"].join("\n"),
  },
};

const RESULT = {
  new: { label: "Baru", tone: "blue" },
  match: { label: "Cocok", tone: "green" },
  warning: { label: "Peringatan", tone: "orange" },
  error: { label: "Galat", tone: "red" },
} as const;

export function ImportPage() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<ImportKind>("mentee");
  const [csv, setCsv] = useState(TEMPLATES.mentee.csv);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const doPreview = useMutation({
    mutationFn: () => staffApi.importPreview(kind, csv),
    onSuccess: setPreview,
    onError: (e) => {
      setPreview(null);
      notifications.show({ color: "red", message: errorMessage(e) });
    },
  });
  const apply = useMutation({
    mutationFn: () => staffApi.importApply(kind, csv),
    onSuccess: ({ applied }) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      notifications.show({
        color: "teal",
        message: `${applied} baris diterapkan.`,
      });
      setPreview(null);
    },
    onError: (e) =>
      notifications.show({ color: "red", message: errorMessage(e) }),
  });

  const counts = preview?.rows.reduce<Record<string, number>>(
    (acc, r) => ({ ...acc, [r.result]: (acc[r.result] ?? 0) + 1 }),
    {},
  );

  return (
    <Screen
      title="Impor peserta"
      subtitle="Pratinjau dulu, lalu terapkan"
      back="/kelola/peserta"
    >
      <Stack gap="md">
        <SegmentedControl
          fullWidth
          value={kind}
          onChange={(v) => {
            const k = v as ImportKind;
            setKind(k);
            setCsv(TEMPLATES[k].csv);
            setPreview(null);
          }}
          data={(Object.keys(TEMPLATES) as ImportKind[]).map((k) => ({
            value: k,
            label: TEMPLATES[k].label,
          }))}
        />
        <Paper p="md">
          <Title order={3}>1. Templat</Title>
          <Text size="sm" c="dimmed" mb="sm">
            Kolom tetap: <code>{TEMPLATES[kind].csv.split("\n")[0]}</code>
          </Text>
          <Button
            variant="light"
            leftSection={<IconDownload size={18} />}
            onClick={() =>
              downloadCsv(
                `templat-${kind}.csv`,
                TEMPLATES[kind].csv.split("\n")[0] + "\n",
              )
            }
          >
            Unduh templat
          </Button>
        </Paper>
        <Paper p="md">
          <Title order={3}>2. Isi berkas</Title>
          <Text size="sm" c="dimmed" mb="sm">
            Unggah CSV atau tempel isinya. Contoh sudah terisi agar bisa
            langsung dicoba.
          </Text>
          <Stack gap="sm">
            <FileButton
              accept=".csv,text/csv"
              onChange={async (file) => {
                if (!file) return;
                setCsv(await file.text());
                setPreview(null);
              }}
            >
              {(props) => (
                <Button
                  {...props}
                  variant="default"
                  leftSection={<IconUpload size={18} />}
                >
                  Pilih berkas CSV
                </Button>
              )}
            </FileButton>
            <Textarea
              aria-label="Isi CSV"
              minRows={5}
              ff="monospace"
              value={csv}
              onChange={(e) => {
                setCsv(e.currentTarget.value);
                setPreview(null);
              }}
            />
            <Button
              leftSection={<IconEye size={18} />}
              loading={doPreview.isPending}
              onClick={() => doPreview.mutate()}
            >
              Pratinjau (tidak menulis apa pun)
            </Button>
          </Stack>
        </Paper>
        {preview && (
          <Paper p="md">
            <Title order={3}>3. Pratinjau</Title>
            <Group gap={6} my="sm">
              {(Object.keys(RESULT) as (keyof typeof RESULT)[]).map((k) =>
                counts?.[k] ? (
                  <StatusBadge
                    key={k}
                    label={`${RESULT[k].label} ${counts[k]}`}
                    tone={RESULT[k].tone}
                  />
                ) : null,
              )}
            </Group>
            <Stack gap="xs">
              {preview.rows.map((r) => (
                <Paper key={r.line} p="sm" bg="var(--surface-subtle)">
                  <Group justify="space-between" wrap="nowrap" mb={2}>
                    <Text size="xs" c="dimmed">
                      Baris {r.line}
                    </Text>
                    <StatusBadge {...RESULT[r.result]} />
                  </Group>
                  <Text size="sm" fw={600} truncate>
                    {r.values.join(" · ")}
                  </Text>
                  <Text size="xs" c={r.result === "error" ? "red.8" : "dimmed"}>
                    {r.message}
                  </Text>
                </Paper>
              ))}
            </Stack>
            {preview.canApply ? (
              <Button
                mt="md"
                fullWidth
                color="teal"
                loading={apply.isPending}
                onClick={() => apply.mutate()}
              >
                Terapkan {preview.rows.length} baris
              </Button>
            ) : (
              <Alert color="red" variant="light" mt="md">
                Masih ada baris galat. Perbaiki berkas lalu pratinjau ulang;
                tidak ada yang ditulis.
              </Alert>
            )}
          </Paper>
        )}
      </Stack>
    </Screen>
  );
}
