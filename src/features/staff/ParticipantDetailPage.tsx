import {
  Alert,
  Button,
  Checkbox,
  Grid,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowsExchange,
  IconLockOpen,
  IconPencil,
  IconUserCog,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { staffApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import type {
  Category,
  KaderisasiOverride,
  ParticipantDetail,
  ParticipantStatus,
  UpdateParticipantInput,
} from "@/api/types";
import { useDesktop } from "@/components/DataTable";
import { Screen } from "@/components/layout/Screen";
import {
  Avatarish,
  KeyValue,
  LinkRow,
  ListGroup,
  Loadable,
  Section,
  StatusBadge,
} from "@/components/ui";
import {
  CATEGORY_LABEL,
  JOURNAL_STATUS,
  OVERRIDE_LABEL,
  PARTICIPANT_STATUS,
  ROLE_LABEL,
} from "@/content/labels";
import { monthLabel } from "@/lib/time";

type ModalKind = "edit" | "mentor" | "status" | null;

function useSaved(id: number, onDone: () => void) {
  const queryClient = useQueryClient();
  return (next: ParticipantDetail) => {
    queryClient.setQueryData(["staff", "participant", id], next);
    queryClient.invalidateQueries({ queryKey: ["staff"] });
    notifications.show({ color: "teal", message: "Data peserta tersimpan." });
    onDone();
  };
}

function EditModal({
  detail,
  onClose,
}: {
  detail: ParticipantDetail;
  onClose: () => void;
}) {
  const p = detail.participant;
  const [form, setForm] = useState<UpdateParticipantInput>({
    isMentee: p.isMentee,
    isMentor: p.isMentor,
    isCoordinator: p.isCoordinator,
    nim: p.nim,
    kipK: p.kipK,
    category: p.category,
    kaderisasiOverride: p.kaderisasiOverride,
    kaderisasiOverrideNote: p.kaderisasiOverrideNote,
    coordinatorUserId: p.coordinatorUserId,
  });
  const set = (patch: Partial<UpdateParticipantInput>) =>
    setForm((f) => ({ ...f, ...patch }));
  const coordinators = useQuery({
    queryKey: ["staff", "participants", { role: "coordinator" }],
    queryFn: () => staffApi.participants({ role: "coordinator" }),
  });
  const save = useMutation({
    mutationFn: () => staffApi.updateParticipant(p.userId, form),
    onSuccess: useSaved(p.userId, onClose),
  });
  return (
    <Stack>
      <Checkbox.Group
        label="Peran"
        value={
          [
            form.isMentee && "mentee",
            form.isMentor && "mentor",
            form.isCoordinator && "coordinator",
          ].filter(Boolean) as string[]
        }
        onChange={(v) =>
          set({
            isMentee: v.includes("mentee"),
            isMentor: v.includes("mentor"),
            isCoordinator: v.includes("coordinator"),
          })
        }
      >
        <Group mt="xs">
          <Checkbox value="mentee" label="Mentee" />
          <Checkbox value="mentor" label="Mentor" />
          <Checkbox value="coordinator" label="Koordinator" />
        </Group>
      </Checkbox.Group>
      {form.isMentee && (
        <>
          <TextInput
            label="NIM"
            inputMode="numeric"
            autoComplete="off"
            value={form.nim ?? ""}
            onChange={(e) => set({ nim: e.currentTarget.value })}
          />
          <Select
            label="Kategori"
            data={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
              value,
              label,
            }))}
            value={form.category}
            onChange={(v) => set({ category: v as Category })}
          />
          <Select
            label="KIP-K"
            data={[
              { value: "ya", label: "Ya" },
              { value: "tidak", label: "Tidak" },
            ]}
            value={form.kipK == null ? null : form.kipK ? "ya" : "tidak"}
            onChange={(v) => set({ kipK: v == null ? null : v === "ya" })}
          />
          <Select
            label="Status kaderisasi manual"
            description="Mis. jalur setara LMD setelah PIC memeriksa bukti."
            clearable
            data={Object.entries(OVERRIDE_LABEL).map(([value, label]) => ({
              value,
              label,
            }))}
            value={form.kaderisasiOverride}
            onChange={(v) =>
              set({ kaderisasiOverride: v as KaderisasiOverride | null })
            }
          />
          {form.kaderisasiOverride && (
            <Textarea
              label="Catatan status manual"
              value={form.kaderisasiOverrideNote ?? ""}
              onChange={(e) =>
                set({ kaderisasiOverrideNote: e.currentTarget.value })
              }
            />
          )}
        </>
      )}
      {form.isMentor && (
        <Select
          label="Koordinator"
          clearable
          data={(coordinators.data ?? []).map((c) => ({
            value: String(c.userId),
            label: c.name,
          }))}
          value={form.coordinatorUserId ? String(form.coordinatorUserId) : null}
          onChange={(v) => set({ coordinatorUserId: v ? Number(v) : null })}
        />
      )}
      {save.isError && <Alert color="red">{errorMessage(save.error)}</Alert>}
      <Button loading={save.isPending} onClick={() => save.mutate()}>
        Simpan
      </Button>
    </Stack>
  );
}

function MentorModal({
  detail,
  onClose,
}: {
  detail: ParticipantDetail;
  onClose: () => void;
}) {
  const [mentor, setMentor] = useState<string | null>(
    detail.participant.mentorUserId
      ? String(detail.participant.mentorUserId)
      : null,
  );
  const mentors = useQuery({
    queryKey: ["staff", "participants", { role: "mentor" }],
    queryFn: () => staffApi.participants({ role: "mentor" }),
  });
  const save = useMutation({
    mutationFn: () =>
      staffApi.moveMentee(
        detail.participant.userId,
        mentor ? Number(mentor) : null,
      ),
    onSuccess: useSaved(detail.participant.userId, onClose),
  });
  return (
    <Stack>
      <Text size="sm" c="dimmed">
        Maks sekali per semester, atas keputusan koordinator. Lapbul bulan
        berjalan yang belum ditanggapi ikut pindah ke mentor baru.
      </Text>
      <Select
        label="Mentor"
        searchable
        clearable
        data={(mentors.data ?? [])
          .filter(
            (m) =>
              m.userId !== detail.participant.userId && m.status !== "inactive",
          )
          .map((m) => ({
            value: String(m.userId),
            label: `${m.name} · ${m.menteeCount} mentee${m.status === "reserve" ? " · cadangan" : ""}`,
          }))}
        value={mentor}
        onChange={setMentor}
      />
      {save.isError && <Alert color="red">{errorMessage(save.error)}</Alert>}
      <Button loading={save.isPending} onClick={() => save.mutate()}>
        Pindahkan
      </Button>
    </Stack>
  );
}

function StatusModal({
  detail,
  onClose,
}: {
  detail: ParticipantDetail;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<ParticipantStatus>(
    detail.participant.status,
  );
  const [reason, setReason] = useState(detail.participant.inactiveReason ?? "");
  const save = useMutation({
    mutationFn: () =>
      staffApi.setStatus(detail.participant.userId, status, reason),
    onSuccess: useSaved(detail.participant.userId, onClose),
  });
  return (
    <Stack>
      <Select
        label="Status"
        data={Object.entries(PARTICIPANT_STATUS).map(([value, v]) => ({
          value,
          label: v.label,
        }))}
        value={status}
        onChange={(v) => v && setStatus(v as ParticipantStatus)}
      />
      {status === "inactive" && (
        <Textarea
          label="Alasan nonaktif"
          description="Wajib. Data dan riwayat tetap terbaca."
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
        />
      )}
      {save.isError && <Alert color="red">{errorMessage(save.error)}</Alert>}
      <Button loading={save.isPending} onClick={() => save.mutate()}>
        Simpan
      </Button>
    </Stack>
  );
}

function ReopenButton({ userId, month }: { userId: number; month: string }) {
  const [opened, setOpened] = useState(false);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const reopen = useMutation({
    mutationFn: () => staffApi.reopenJournal(userId, month, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["staff", "participant", userId],
      });
      notifications.show({
        color: "teal",
        message: `Lapbul ${monthLabel(month)} dibuka kembali.`,
      });
      setOpened(false);
    },
  });
  return (
    <>
      <Button
        size="xs"
        variant="light"
        leftSection={<IconLockOpen size={14} />}
        onClick={() => setOpened(true)}
      >
        Buka kembali
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`Buka kembali lapbul ${monthLabel(month)}`}
        centered
      >
        <Stack>
          <Textarea
            label="Alasan"
            description="Wajib, mis. kendala akses dekat tenggat."
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />
          {reopen.isError && (
            <Alert color="red">{errorMessage(reopen.error)}</Alert>
          )}
          <Button
            disabled={!reason.trim()}
            loading={reopen.isPending}
            onClick={() => reopen.mutate()}
          >
            Buka kembali
          </Button>
        </Stack>
      </Modal>
    </>
  );
}

export function ParticipantDetailPage() {
  const { userId = "" } = useParams();
  const id = Number(userId);
  const [modal, setModal] = useState<ModalKind>(null);
  const query = useQuery({
    queryKey: ["staff", "participant", id],
    queryFn: () => staffApi.participant(id),
  });
  const close = () => setModal(null);
  const desktop = useDesktop();

  return (
    <Screen
      title={query.data?.profile.name ?? "Peserta"}
      subtitle="Data peserta"
      back="/kelola/peserta"
      width="wide"
    >
      <Loadable query={query}>
        {(d) => {
          const p = d.participant;
          const identity = (
            <>
              <Paper p="lg">
                <Group wrap="nowrap" align="flex-start">
                  <Avatarish name={d.profile.name} size={52} />
                  <div style={{ minWidth: 0 }}>
                    <Title order={3}>{d.profile.name}</Title>
                    <Text size="sm" c="dimmed" truncate>
                      {d.profile.email}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {d.profile.university} · T{d.row.tingkat}
                    </Text>
                    <Group gap={6} mt={6}>
                      <StatusBadge {...PARTICIPANT_STATUS[p.status]} />
                      {d.row.roles.map((r) => (
                        <StatusBadge
                          key={r}
                          label={ROLE_LABEL[r]}
                          tone="blue"
                          variant="outline"
                        />
                      ))}
                    </Group>
                  </div>
                </Group>
                {p.inactiveReason && (
                  <Text size="sm" c="dimmed" mt="sm">
                    {p.inactiveReason}
                  </Text>
                )}
              </Paper>
            </>
          );
          const actions = (
            <>
              <Group grow gap="xs">
                <Button
                  variant="light"
                  size="sm"
                  px="xs"
                  leftSection={<IconPencil size={16} />}
                  onClick={() => setModal("edit")}
                >
                  Ubah
                </Button>
                {p.isMentee && (
                  <Button
                    variant="light"
                    size="sm"
                    px="xs"
                    leftSection={<IconArrowsExchange size={16} />}
                    onClick={() => setModal("mentor")}
                  >
                    Pindah
                  </Button>
                )}
                <Button
                  variant="light"
                  size="sm"
                  px="xs"
                  leftSection={<IconUserCog size={16} />}
                  onClick={() => setModal("status")}
                >
                  Status
                </Button>
              </Group>
            </>
          );
          const menteeData = (
            <>
              {p.isMentee && (
                <Section title="Mentee">
                  <KeyValue
                    items={[
                      ["NIM", p.nim],
                      ["Kategori", p.category && CATEGORY_LABEL[p.category]],
                      [
                        "KIP-K",
                        p.kipK == null ? null : p.kipK ? "Ya" : "Tidak",
                      ],
                      ["Mentor", d.row.mentorName ?? "Belum ada"],
                      ["Koordinator", d.row.coordinatorName],
                      [
                        "Status kaderisasi",
                        p.kaderisasiOverride
                          ? `${OVERRIDE_LABEL[p.kaderisasiOverride]} (manual)`
                          : d.profile.lmdStatus,
                      ],
                      ["Unit/club", d.row.clubOk ? "✔ Terdaftar" : "✘ Belum"],
                      [
                        "Akun",
                        p.hasAccount ? "Aktif" : "Belum aktif (no_account)",
                      ],
                    ]}
                  />
                </Section>
              )}
            </>
          );
          const groups = (
            <>
              {p.isMentor && (
                <Section
                  title="Mentor & kelompok"
                  description={`Koordinator: ${d.row.coordinatorName ?? "—"}`}
                >
                  {d.mentees.length ? (
                    <ListGroup>
                      {d.mentees.map((m) => (
                        <LinkRow
                          key={m.userId}
                          to={`/kelola/peserta/${m.userId}`}
                          title={m.name}
                        />
                      ))}
                    </ListGroup>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Belum ada mentee
                      {p.status === "reserve" ? " (mentor cadangan)" : ""}.
                    </Text>
                  )}
                </Section>
              )}
              {p.isCoordinator && (
                <Section title="Mentor binaan">
                  {d.mentors.length ? (
                    <ListGroup>
                      {d.mentors.map((m) => (
                        <LinkRow
                          key={m.userId}
                          to={`/kelola/peserta/${m.userId}`}
                          title={m.name}
                        />
                      ))}
                    </ListGroup>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Belum ada mentor binaan. Tetapkan koordinator ini di
                      halaman mentornya (Ubah) atau lewat impor mentor.
                    </Text>
                  )}
                </Section>
              )}
            </>
          );
          const journals = (
            <>
              {p.isMentee && (
                <Section title="Catatan Perjalanan">
                  <Stack gap={0} className="qa">
                    {d.journals.map((j) => (
                      <Group
                        key={j.month}
                        justify="space-between"
                        wrap="nowrap"
                      >
                        <div>
                          <Text size="sm" fw={600}>
                            {monthLabel(j.month)}
                          </Text>
                          <Group gap={4}>
                            <StatusBadge {...JOURNAL_STATUS[j.status]} />
                            {j.isLate && (
                              <StatusBadge
                                label="Terlambat"
                                tone="orange"
                                variant="outline"
                              />
                            )}
                          </Group>
                        </div>
                        {j.journalId && j.status !== "draft" ? (
                          <Button
                            size="xs"
                            variant="default"
                            component={Link}
                            to={`/kelola/lapbul/${j.journalId}`}
                          >
                            Baca
                          </Button>
                        ) : j.window === "locked" ? (
                          <ReopenButton userId={p.userId} month={j.month} />
                        ) : null}
                      </Group>
                    ))}
                  </Stack>
                </Section>
              )}
            </>
          );
          return (
            <>
              {desktop ? (
                <Grid gap="lg">
                  <Grid.Col span={4}>
                    <Stack gap="lg">
                      {identity}
                      {actions}
                      {p.isMentee && groups}
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Stack gap="lg">
                      {menteeData}
                      {!p.isMentee && groups}
                      {journals}
                    </Stack>
                  </Grid.Col>
                </Grid>
              ) : (
                <Stack gap="lg">
                  {identity}
                  {actions}
                  {menteeData}
                  {groups}
                  {journals}
                </Stack>
              )}
              <Modal
                opened={modal === "edit"}
                onClose={close}
                title="Ubah data & peran"
                centered
              >
                <EditModal detail={d} onClose={close} />
              </Modal>
              <Modal
                opened={modal === "mentor"}
                onClose={close}
                title="Pindah kelompok"
                centered
              >
                <MentorModal detail={d} onClose={close} />
              </Modal>
              <Modal
                opened={modal === "status"}
                onClose={close}
                title="Ubah status"
                centered
              >
                <StatusModal detail={d} onClose={close} />
              </Modal>
            </>
          );
        }}
      </Loadable>
    </Screen>
  );
}
