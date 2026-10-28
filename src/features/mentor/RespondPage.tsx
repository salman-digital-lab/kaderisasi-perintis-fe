import {
  Accordion,
  Alert,
  Anchor,
  Button,
  Group,
  Modal,
  Paper,
  Radio,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconLock,
  IconAlertTriangle,
  IconCheck,
  IconLifebuoy,
  IconPhoneCall,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { participantApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import type { JournalForMentor, ResponseDecision } from "@/api/types";
import { Screen } from "@/components/layout/Screen";
import {
  Avatarish,
  EmptyState,
  Loadable,
  MultilineText,
  Note,
  PulseBars,
  StatusBadge,
} from "@/components/ui";
import {
  CATEGORY_LABEL,
  FLAG_STATUS,
  FLAG_TRIGGER,
  JOURNAL_STATUS,
  REFERRAL_GUIDE,
} from "@/content/labels";
import { MAX_LONG } from "@/content/lapbulForm";
import {
  deadlines,
  fmtDate,
  fmtDateTime,
  hoursLeft,
  monthLabel,
} from "@/lib/time";
import { JournalContent } from "@/features/shared/JournalContent";

function FlagPanel({ data }: { data: JournalForMentor }) {
  const flag = data.journal.flag!;
  const [opened, { open, close }] = useDisclosure(false);
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const handle = useMutation({
    mutationFn: () => participantApi.handleFlag(data.journal.id, note),
    onSuccess: (next) => {
      queryClient.setQueryData(
        ["p", "journal-mentor", String(data.journal.id)],
        next,
      );
      queryClient.invalidateQueries({ queryKey: ["p", "mentor-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      close();
      notifications.show({
        color: "teal",
        message: "Bendera ditandai sudah dihubungi.",
      });
    },
  });
  const active =
    flag.status === "open" || (flag.status === "escalated" && !flag.handledAt);
  return (
    <Paper p="lg" style={{ borderColor: "var(--mantine-color-red-4)" }}>
      <Group justify="space-between" wrap="nowrap">
        <Group gap={6}>
          <IconAlertTriangle size={20} color="var(--mantine-color-red-7)" />
          <Title order={3}>Bendera kesejahteraan</Title>
        </Group>
        <StatusBadge {...FLAG_STATUS[flag.status]} />
      </Group>
      <Text size="sm" mt="xs">
        {FLAG_TRIGGER[flag.trigger]}
        {flag.status === "open" && ` · hubungi dalam ${hoursLeft(flag.dueAt)}`}
      </Text>
      {flag.handledAt && (
        <Text size="sm" c="dimmed" mt={4}>
          Dihubungi {fmtDateTime(flag.handledAt)}:{" "}
          <span className="multiline">{flag.privateNote}</span>
        </Text>
      )}
      {active && (
        <Button
          mt="sm"
          color="red"
          leftSection={<IconPhoneCall size={18} />}
          onClick={open}
          fullWidth
        >
          Sudah dihubungi
        </Button>
      )}
      <Modal
        opened={opened}
        onClose={close}
        title="Tandai sudah dihubungi"
        centered
      >
        <Stack>
          <Textarea
            label="Catatan privat"
            description="Hanya terlihat olehmu dan pengelola."
            minRows={3}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.currentTarget.value)}
          />
          {handle.isError && (
            <Alert color="red">{errorMessage(handle.error)}</Alert>
          )}
          <Button
            loading={handle.isPending}
            disabled={!note.trim()}
            onClick={() => handle.mutate()}
          >
            Simpan
          </Button>
        </Stack>
      </Modal>
    </Paper>
  );
}

function ResponseForm({ data }: { data: JournalForMentor }) {
  const r = data.journal.response;
  const queryClient = useQueryClient();
  const [appreciation, setAppreciation] = useState(r?.appreciation ?? "");
  const [text, setText] = useState(r?.text ?? "");
  const current = data.journal.status;
  const [decision, setDecision] = useState<ResponseDecision>(
    current === "revision_requested" || current === "flagged"
      ? current
      : "accepted",
  );
  const [revisionRequest, setRevisionRequest] = useState(
    r?.revisionRequest ?? "",
  );
  const [flagReason, setFlagReason] = useState(r?.flagReason ?? "");

  const save = useMutation({
    mutationFn: () =>
      participantApi.respond(data.journal.id, {
        appreciation,
        text,
        decision,
        revisionRequest:
          decision === "revision_requested" ? revisionRequest : undefined,
        flagReason: decision === "flagged" ? flagReason : undefined,
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(
        ["p", "journal-mentor", String(data.journal.id)],
        next,
      );
      queryClient.invalidateQueries({ queryKey: ["p", "mentor-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      notifications.show({
        color: "teal",
        icon: <IconCheck size={18} />,
        message: "Tanggapan tersimpan dan tampil di lapbul mentee.",
      });
    },
  });

  const valid =
    appreciation.trim() &&
    text.trim() &&
    (decision !== "revision_requested" || revisionRequest.trim()) &&
    (decision !== "flagged" || flagReason.trim());

  if (!data.canRespond)
    return <Note icon={IconLock}>{data.respondLockedReason}</Note>;

  return (
    <Stack gap="lg">
      {r && (
        <Text size="xs" c="dimmed">
          Tanggapan terakhir {fmtDateTime(r.respondedAt)}. Bisa disunting sampai{" "}
          {fmtDate(
            deadlines(data.journal.month).responseEditableUntil,
            "D MMM",
          )}
          ; hanya versi terakhir yang disimpan.
        </Text>
      )}
      <Textarea
        label="Apresiasi spesifik"
        description="Sebut hal konkret dari isiannya."
        minRows={3}
        maxLength={MAX_LONG}
        value={appreciation}
        onChange={(e) => setAppreciation(e.currentTarget.value)}
      />
      <Textarea
        label="Tanggapan"
        minRows={4}
        maxLength={MAX_LONG}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
      />
      <Radio.Group
        label="Keputusan"
        value={decision}
        onChange={(v) => setDecision(v as ResponseDecision)}
      >
        <Stack gap="xs" mt="xs">
          <Radio.Card value="accepted" p="sm" radius="md">
            <Group wrap="nowrap" gap="sm">
              <Radio.Indicator />
              <div>
                <Text fw={600} size="sm">
                  Diterima
                </Text>
                <Text size="xs" c="dimmed">
                  Lapbul sudah baik.
                </Text>
              </div>
            </Group>
          </Radio.Card>
          <Radio.Card value="revision_requested" p="sm" radius="md">
            <Group wrap="nowrap" gap="sm">
              <Radio.Indicator />
              <div>
                <Text fw={600} size="sm">
                  Perlu perbaikan
                </Text>
                <Text size="xs" c="dimmed">
                  Mentee punya 7 hari untuk memperbaiki.
                </Text>
              </div>
            </Group>
          </Radio.Card>
          <Radio.Card value="flagged" p="sm" radius="md">
            <Group wrap="nowrap" gap="sm">
              <Radio.Indicator />
              <div>
                <Text fw={600} size="sm">
                  Ditandai ke pengelola
                </Text>
                <Text size="xs" c="dimmed">
                  Kondisi butuh penanganan: ekonomi mendesak, kesehatan, masalah
                  serius.
                </Text>
              </div>
            </Group>
          </Radio.Card>
        </Stack>
      </Radio.Group>
      {decision === "revision_requested" && (
        <Textarea
          label="Permintaan perbaikan"
          description="Sebut bagian yang perlu diperbaiki."
          minRows={3}
          maxLength={MAX_LONG}
          value={revisionRequest}
          onChange={(e) => setRevisionRequest(e.currentTarget.value)}
        />
      )}
      {decision === "flagged" && (
        <Textarea
          label="Alasan ditandai"
          description="Hanya terlihat pengelola."
          minRows={3}
          maxLength={MAX_LONG}
          value={flagReason}
          onChange={(e) => setFlagReason(e.currentTarget.value)}
        />
      )}
      {save.isError && <Alert color="red">{errorMessage(save.error)}</Alert>}
      <Button
        size="md"
        disabled={!valid}
        loading={save.isPending}
        onClick={() => save.mutate()}
      >
        {r ? "Perbarui tanggapan" : "Simpan tanggapan"}
      </Button>
      <Accordion variant="contained" radius="md">
        <Accordion.Item value="guide">
          <Accordion.Control icon={<IconLifebuoy size={18} />}>
            Panduan rujukan
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
  );
}

export function RespondPage() {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: ["p", "journal-mentor", id],
    queryFn: () => participantApi.journal(Number(id)),
  });
  const [tab, setTab] = useState<string | null>("isian");
  const d = query.data;
  return (
    <Screen
      title={d ? d.mentee.name : "Tanggapi lapbul"}
      subtitle={d ? `Lapbul ${monthLabel(d.journal.month)}` : undefined}
      back="/kelompok"
    >
      <Loadable query={query}>
        {(data) => (
          <Stack gap="lg">
            <Paper p="lg">
              <Group wrap="nowrap" align="flex-start">
                <Avatarish name={data.mentee.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={700}>{data.mentee.name}</Text>
                  <Text size="xs" c="dimmed">
                    {data.mentee.university} · {data.mentee.major} · T
                    {data.mentee.tingkat}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {CATEGORY_LABEL[data.mentee.category]} · KIP-K{" "}
                    {data.mentee.kipK ? "ya" : "tidak"}
                  </Text>
                  <Group gap={6} mt={6}>
                    <StatusBadge {...JOURNAL_STATUS[data.journal.status]} />
                    {data.journal.isLate && (
                      <StatusBadge label="Terlambat" tone="orange" />
                    )}
                  </Group>
                </div>
              </Group>
              <Anchor
                component={Link}
                to={`/kelompok/mentee/${data.mentee.userId}`}
                size="sm"
                fw={600}
                mt="sm"
                display="block"
              >
                Lihat profil lengkap
              </Anchor>
            </Paper>
            {data.journal.flag && data.journal.flag.status !== "resolved" && (
              <FlagPanel data={data} />
            )}
            <Tabs value={tab} onChange={setTab} variant="pills" radius="md">
              <Tabs.List grow>
                <Tabs.Tab value="isian">Isian</Tabs.Tab>
                <Tabs.Tab value="riwayat">Riwayat</Tabs.Tab>
                <Tabs.Tab value="tanggapan">Tanggapi</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="isian" pt="md">
                <JournalContent
                  journal={data.journal}
                  previousTargets={data.previousTargets}
                  showSensitive
                />
                <Button
                  fullWidth
                  mt="md"
                  onClick={() => {
                    setTab("tanggapan");
                    window.scrollTo({ top: 0 });
                  }}
                >
                  Tulis tanggapan
                </Button>
              </Tabs.Panel>
              <Tabs.Panel value="riwayat" pt="md">
                {data.history.length ? (
                  <Stack gap="sm">
                    {data.history.map((h) => (
                      <Paper key={h.month} p="lg">
                        <Group justify="space-between" mb="xs">
                          <Title order={4}>{monthLabel(h.month)}</Title>
                          <StatusBadge {...JOURNAL_STATUS[h.status]} />
                        </Group>
                        <PulseBars pulse={h.pulse} />
                        {h.appreciation && (
                          <>
                            <Text size="xs" fw={700} c="dimmed" mt="sm">
                              Apresiasi
                            </Text>
                            <MultilineText size="sm">
                              {h.appreciation}
                            </MultilineText>
                          </>
                        )}
                        {h.responseText && (
                          <>
                            <Text size="xs" fw={700} c="dimmed" mt="xs">
                              Tanggapan
                            </Text>
                            <MultilineText size="sm">
                              {h.responseText}
                            </MultilineText>
                          </>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <EmptyState
                    title="Belum ada riwayat"
                    description="Ini lapbul pertama mentee."
                  />
                )}
              </Tabs.Panel>
              <Tabs.Panel value="tanggapan" pt="md">
                <ResponseForm
                  key={data.journal.response?.respondedAt ?? "new"}
                  data={data}
                />
              </Tabs.Panel>
            </Tabs>
          </Stack>
        )}
      </Loadable>
    </Screen>
  );
}
