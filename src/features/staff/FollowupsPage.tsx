import {
  Accordion,
  Alert,
  Anchor,
  Button,
  Chip,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLifebuoy } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { staffApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import type { FollowupItem } from "@/api/types";
import { Screen } from "@/components/layout/Screen";
import {
  EmptyState,
  Loadable,
  MultilineText,
  StatusBadge,
} from "@/components/ui";
import { REFERRAL_GUIDE } from "@/content/labels";
import { ageLabel, fmtDateTime, monthShort } from "@/lib/time";

const SOURCE: Record<
  FollowupItem["source"],
  { label: string; tone: "red" | "orange" | "violet" }
> = {
  journal: { label: "Lapbul ditandai", tone: "red" },
  flag: { label: "Bendera > 3 hari", tone: "orange" },
  report: { label: "Kasus laporan", tone: "violet" },
};

function ResolveModal({
  item,
  onClose,
}: {
  item: FollowupItem | null;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const resolve = useMutation({
    mutationFn: () => staffApi.resolveFollowup(item!.source, item!.id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      notifications.show({ color: "teal", message: "Ditandai ditangani." });
      setNote("");
      onClose();
    },
  });
  return (
    <Modal opened={!!item} onClose={onClose} title="Tandai ditangani" centered>
      <Stack>
        <Text size="sm" c="dimmed">
          {item?.subject} · {item && SOURCE[item.source].label}
        </Text>
        <Textarea
          label="Catatan penanganan"
          description="Wajib. Hanya terlihat pengelola."
          minRows={3}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
        />
        {resolve.isError && (
          <Alert color="red">{errorMessage(resolve.error)}</Alert>
        )}
        <Button
          disabled={!note.trim()}
          loading={resolve.isPending}
          onClick={() => resolve.mutate()}
        >
          Simpan
        </Button>
      </Stack>
    </Modal>
  );
}

export function FollowupsPage() {
  const [status, setStatus] = useState("open");
  const [source, setSource] = useState("");
  const [active, setActive] = useState<FollowupItem | null>(null);
  const query = useQuery({
    queryKey: ["staff", "followups", { status, source }],
    queryFn: () => staffApi.followups({ status, source }),
  });

  return (
    <Screen
      width="wide"
      title="Perlu tindak lanjut"
      subtitle="Paling lama terbuka di atas"
    >
      <Stack gap="lg">
        <Chip.Group value={status} onChange={(v) => setStatus(v as string)}>
          <Group gap={6}>
            <Chip value="open" size="sm">
              Terbuka
            </Chip>
            <Chip value="handled" size="sm">
              Ditangani
            </Chip>
          </Group>
        </Chip.Group>
        <Chip.Group value={source} onChange={(v) => setSource(v as string)}>
          <Group gap={6} wrap="nowrap" className="hscroll">
            <Chip value="" size="sm">
              Semua
            </Chip>
            <Chip value="journal" size="sm">
              Lapbul
            </Chip>
            <Chip value="flag" size="sm">
              Bendera
            </Chip>
            <Chip value="report" size="sm">
              Kasus
            </Chip>
          </Group>
        </Chip.Group>
        <Loadable query={query}>
          {(items) =>
            items.length ? (
              <Stack gap="sm">
                {items.map((f) => (
                  <Paper key={`${f.source}-${f.id}`} p="md">
                    <Group justify="space-between" wrap="nowrap" mb={6}>
                      <StatusBadge {...SOURCE[f.source]} />
                      <Text size="xs" c="dimmed">
                        {f.status === "open"
                          ? `Terbuka ${ageLabel(f.openedAt)}`
                          : "Ditangani"}{" "}
                        · {monthShort(f.month)}
                      </Text>
                    </Group>
                    <Text fw={700}>{f.subject}</Text>
                    <Text size="xs" c="dimmed" mb="xs">
                      Mentor {f.mentorName ?? "—"} · Koordinator{" "}
                      {f.coordinatorName ?? "—"}
                    </Text>
                    <MultilineText size="sm">{f.detail}</MultilineText>
                    {f.source !== "report" && (
                      <Anchor
                        component={Link}
                        to={`/kelola/lapbul/${f.id}`}
                        size="sm"
                        fw={600}
                        mt="xs"
                        display="inline-block"
                      >
                        Buka lapbul
                      </Anchor>
                    )}
                    {f.handled && (
                      <Paper p="sm" mt="sm" bg="var(--surface-subtle)">
                        <Text size="xs" c="dimmed">
                          {f.handled.by} · {fmtDateTime(f.handled.at)}
                        </Text>
                        <MultilineText size="sm">
                          {f.handled.note}
                        </MultilineText>
                      </Paper>
                    )}
                    {f.status === "open" && (
                      <Button
                        size="sm"
                        mt="sm"
                        fullWidth
                        variant="light"
                        onClick={() => setActive(f)}
                      >
                        Tandai ditangani
                      </Button>
                    )}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <EmptyState
                title={
                  status === "open"
                    ? "Tidak ada yang perlu ditindaklanjuti"
                    : "Belum ada yang ditangani"
                }
              />
            )
          }
        </Loadable>
        <Accordion variant="contained" radius="md">
          <Accordion.Item value="guide">
            <Accordion.Control icon={<IconLifebuoy size={18} />}>
              Panduan rujukan (Bab 12.3)
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                {REFERRAL_GUIDE.map((g) => (
                  <Text key={g} size="sm">
                    • {g}
                  </Text>
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
      <ResolveModal item={active} onClose={() => setActive(null)} />
    </Screen>
  );
}
