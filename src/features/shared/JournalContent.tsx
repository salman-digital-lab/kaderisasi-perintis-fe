import {
  Badge,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconFileText, IconLock } from "@tabler/icons-react";
import type { ReactNode } from "react";
import type { Journal, JournalFile } from "@/api/types";
import { MultilineText, PulseBars } from "@/components/ui";
import { TARGET_RESULTS } from "@/content/lapbulForm";
import { formatSize } from "@/lib/files";
import { asksForGrades } from "@/lib/time";

function Block({
  title,
  sensitive,
  showSensitive,
  children,
}: {
  title: string;
  sensitive?: boolean;
  showSensitive?: boolean;
  children: ReactNode;
}) {
  return (
    <Paper p="lg">
      <Group justify="space-between" mb="md" wrap="nowrap">
        <Title order={3}>{title}</Title>
        {sensitive && showSensitive && (
          <Badge
            color="grape"
            variant="light"
            radius="sm"
            tt="none"
            leftSection={<IconLock size={12} />}
          >
            Sensitif
          </Badge>
        )}
      </Group>
      <Stack gap={0} className="qa">
        {children}
      </Stack>
    </Paper>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Text size="xs" fw={700} c="dimmed" mb={6}>
        {label}
      </Text>
      {typeof children === "string" || children == null ? (
        <MultilineText size="sm">{children as string | null}</MultilineText>
      ) : (
        children
      )}
    </div>
  );
}

export function FileList({
  files,
}: {
  files:
    | JournalFile[]
    | {
        key: string;
        name: string;
        mime: string;
        size: number;
        previewUrl: string | null;
      }[];
}) {
  if (!files.length)
    return (
      <Text size="sm" c="dimmed">
        Tidak ada berkas.
      </Text>
    );
  return (
    <SimpleGrid cols={2} spacing="xs">
      {files.map((f) =>
        f.previewUrl && f.mime.startsWith("image/") ? (
          <Image
            key={f.key}
            src={f.previewUrl}
            alt={f.name}
            radius="sm"
            h={110}
            fit="cover"
          />
        ) : (
          <Paper key={f.key} p="xs" bg="var(--surface-subtle)">
            <Group gap={6} wrap="nowrap">
              <IconFileText size={20} />
              <div style={{ minWidth: 0 }}>
                <Text size="xs" fw={600} truncate>
                  {f.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatSize(f.size)}
                </Text>
              </div>
            </Group>
          </Paper>
        ),
      )}
    </SimpleGrid>
  );
}

/** Read-only lapbul answers in form order; multiline answers keep their line breaks. */
export function JournalContent({
  journal,
  previousTargets,
  showSensitive = false,
}: {
  journal: Journal;
  previousTargets: string[] | null;
  showSensitive?: boolean;
}) {
  const a = journal.answers;
  const resultLabel = (v?: string) =>
    TARGET_RESULTS.find((r) => r.value === v)?.label ?? "—";
  return (
    <Stack gap="sm">
      <Block title="1 · Kabar & pulse" sensitive showSensitive={showSensitive}>
        <PulseBars pulse={journal.pulse} />
        <Item label="1b · Satu kalimat tentang bulan ini">{a.s1b}</Item>
        <Item label="1c · Kabar keluarga">{a.s1c}</Item>
        <Item label="1d · Kendala">{a.s1d}</Item>
        <Item label="1e · Ingin dihubungi secara pribadi">
          {journal.wantsContact ? "Ya" : "Tidak"}
        </Item>
      </Block>
      <Block title="2 · Target">
        {previousTargets && (
          <Item label="2a · Target bulan lalu">
            <Stack gap={6}>
              {previousTargets.map((t, i) => (
                <Group
                  key={i}
                  wrap="nowrap"
                  align="flex-start"
                  justify="space-between"
                  gap="xs"
                >
                  <Text size="sm" className="multiline" style={{ flex: 1 }}>
                    {t}
                  </Text>
                  <Badge
                    variant="light"
                    radius="sm"
                    tt="none"
                    color={
                      a.s2a?.[i] === "tercapai"
                        ? "green"
                        : a.s2a?.[i] === "sebagian"
                          ? "yellow"
                          : "gray"
                    }
                  >
                    {resultLabel(a.s2a?.[i])}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Item>
        )}
        <Item label="2b · Yang membantu atau menghambat">{a.s2b}</Item>
        <Item label="2c · Tiga target bulan depan">
          <Stack gap={4}>
            {(a.targets ?? []).map((t, i) => (
              <Text key={i} size="sm" className="multiline">
                {i + 1}. {t || "—"}
              </Text>
            ))}
          </Stack>
        </Item>
      </Block>
      <Block title="3 · Insight & bukti">
        <Item label="3a · Insight terbesar">{a.s3a}</Item>
        <Item label="3b · Bukti praktik">
          <FileList files={journal.files.filter((f) => f.field === "s3b")} />
        </Item>
      </Block>
      <Block title="5 · Ruhiyah">
        <Item label="5a · Tilawah/bacaan kitab suci">
          {`${a.s5aPages ?? "—"} halaman\n${a.s5aVerse ?? ""}`}
        </Item>
        <Item label="5b · Amalan yang dijaga">{a.s5b}</Item>
        <Item label="5c · Bentuk berbagi">
          {`${(a.s5cKinds ?? []).join(", ") || "—"}${a.s5cText ? `\n${a.s5cText}` : ""}`}
        </Item>
        <Item label="5d · Hafalan">
          {a.s5d != null ? `${a.s5d} surat` : "Tidak diisi"}
        </Item>
      </Block>
      <Block title="6 · Ukhuwah">
        <Item label="Teman Perintis & pelajaran">{a.s6}</Item>
      </Block>
      {asksForGrades(journal.month) && (
        <Block title="7 · IP & KHS">
          <Item label="IP semester">
            {a.s7ip != null ? String(a.s7ip) : null}
          </Item>
          <FileList files={journal.files.filter((f) => f.field === "s7khs")} />
        </Block>
      )}
      {journal.category === "biaya_hidup" && (
        <Block
          title="8 · Kondisi ekonomi"
          sensitive
          showSensitive={showSensitive}
        >
          <Item label="8a · Kondisi berubah?">
            {a.s8aChanged == null
              ? null
              : `${a.s8aChanged ? "Ya" : "Tidak"}${a.s8aText ? `\n${a.s8aText}` : ""}`}
          </Item>
          <Item label="8b · Bantuan terpakai untuk">
            {(a.s8b ?? []).join(", ")}
          </Item>
        </Block>
      )}
    </Stack>
  );
}
