import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconSearch, IconUserPlus, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { staffApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import {
  ADD_PARTICIPANT_PERMISSION,
  type AddParticipantInput,
  type Category,
  type MemberCandidate,
} from "@/api/types";
import { useAuth } from "@/auth/AuthProvider";
import { Screen } from "@/components/layout/Screen";
import {
  Avatarish,
  EmptyState,
  ListGroup,
  Loadable,
  Note,
  StatusBadge,
} from "@/components/ui";
import { CATEGORY_LABEL, ROLE_LABEL } from "@/content/labels";
import classes from "./AddParticipantPage.module.css";

const MIN_QUERY = 3;

function memberLine(m: MemberCandidate) {
  return [m.email, m.memberId].filter(Boolean).join(" · ");
}

function schoolLine(m: MemberCandidate) {
  return [m.university, m.major, m.intakeYear && `angkatan ${m.intakeYear}`]
    .filter(Boolean)
    .join(" · ");
}

function ResultRow({
  member,
  selected,
  onSelect,
}: {
  member: MemberCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const body = (
    <Group wrap="nowrap" gap="sm" align="flex-start">
      <Avatarish name={member.name} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text fw={700} size="sm" truncate>
          {member.name}
        </Text>
        <Text size="xs" c="dimmed" truncate>
          {memberLine(member) || "Tanpa email"}
        </Text>
        {schoolLine(member) && (
          <Text size="xs" c="dimmed" truncate>
            {schoolLine(member)}
          </Text>
        )}
        {member.participant && (
          <Group gap={6} mt={6}>
            {member.roles.length ? (
              member.roles.map((r) => (
                <StatusBadge key={r} label={ROLE_LABEL[r]} tone="blue" />
              ))
            ) : (
              <StatusBadge label="Peserta nonaktif" tone="gray" />
            )}
          </Group>
        )}
      </div>
    </Group>
  );
  if (member.participant)
    return (
      <UnstyledButton
        component={Link}
        to={`/kelola/peserta/${member.userId}`}
        className={classes.result}
        aria-label={`${member.name}, sudah peserta. Buka halaman peserta`}
      >
        {body}
        <Text size="xs" fw={700} c="blue.7" mt={6} ml={48}>
          Sudah peserta · buka halamannya
        </Text>
      </UnstyledButton>
    );
  return (
    <UnstyledButton
      className={classes.result}
      data-selected={selected || undefined}
      aria-pressed={selected}
      aria-label={`Pilih ${member.name}${member.email ? `, ${member.email}` : ""}`}
      onClick={onSelect}
    >
      {body}
    </UnstyledButton>
  );
}

const emptyForm = {
  isMentee: false,
  isMentor: false,
  isCoordinator: false,
  nim: "",
  category: null as Category | null,
  kipK: null as boolean | null,
  mentorUserId: null as string | null,
  coordinatorUserId: null as string | null,
};

function AddForm({
  member,
  onCancel,
}: {
  member: MemberCandidate;
  onCancel: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const set = (patch: Partial<typeof emptyForm>) =>
    setForm((f) => ({ ...f, ...patch }));
  const mentors = useQuery({
    queryKey: ["staff", "participants", { role: "mentor" }],
    queryFn: () => staffApi.participants({ role: "mentor" }),
    enabled: form.isMentee,
  });
  const coordinators = useQuery({
    queryKey: ["staff", "participants", { role: "coordinator" }],
    queryFn: () => staffApi.participants({ role: "coordinator" }),
    enabled: form.isMentor,
  });
  const save = useMutation({
    mutationFn: () => {
      const input: AddParticipantInput = {
        userId: member.userId,
        isMentee: form.isMentee,
        isMentor: form.isMentor,
        isCoordinator: form.isCoordinator,
        nim: form.isMentee ? form.nim.trim() || null : null,
        category: form.isMentee ? form.category : null,
        kipK: form.isMentee ? form.kipK : null,
        mentorUserId:
          form.isMentee && form.mentorUserId ? Number(form.mentorUserId) : null,
        coordinatorUserId:
          form.isMentor && form.coordinatorUserId
            ? Number(form.coordinatorUserId)
            : null,
      };
      return staffApi.addParticipant(input);
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(["staff", "participant", member.userId], detail);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      notifications.show({
        color: "teal",
        message: `${member.name} ditambahkan sebagai peserta.`,
      });
      navigate(`/kelola/peserta/${member.userId}`);
    },
  });
  const noRole = !form.isMentee && !form.isMentor && !form.isCoordinator;

  return (
    <Paper p="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="md">
        <Group wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
          <Avatarish name={member.name} size={44} />
          <div style={{ minWidth: 0 }}>
            <Title order={3}>{member.name}</Title>
            <Text size="sm" c="dimmed" truncate>
              {memberLine(member) || "Tanpa email"}
            </Text>
            {!member.hasAccount && (
              <Text size="xs" c="orange.8" fw={600} mt={2}>
                Akun belum aktif: bisa masuk dengan Google memakai email ini,
                atau buat kata sandi lewat “Buat akun”.
              </Text>
            )}
          </div>
        </Group>
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          leftSection={<IconX size={14} />}
          style={{ flexShrink: 0 }}
          onClick={onCancel}
        >
          Ganti
        </Button>
      </Group>
      <Stack>
        <Checkbox.Group
          label="Peran"
          description="Satu orang boleh memegang lebih dari satu peran."
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
            <Select
              label="Mentor"
              description="Opsional; bisa diatur nanti lewat Pindah di halaman peserta."
              searchable
              clearable
              data={(mentors.data ?? [])
                .filter((m) => m.status !== "inactive")
                .map((m) => ({
                  value: String(m.userId),
                  label: `${m.name} · ${m.menteeCount} mentee`,
                }))}
              value={form.mentorUserId}
              onChange={(v) => set({ mentorUserId: v })}
            />
            <Stack gap="sm" className={classes.later}>
              <div>
                <Text size="sm" fw={600}>
                  Data beasiswa (opsional)
                </Text>
                <Text size="xs" c="dimmed">
                  Boleh dikosongkan dan dilengkapi nanti lewat Ubah. Selama
                  kategori belum diisi, mentee belum bisa mengisi Catatan
                  Perjalanan.
                </Text>
              </div>
              <TextInput
                label="NIM"
                inputMode="numeric"
                autoComplete="off"
                value={form.nim}
                onChange={(e) => set({ nim: e.currentTarget.value })}
              />
              <Select
                label="Kategori"
                clearable
                data={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={form.category}
                onChange={(v) => set({ category: v as Category | null })}
              />
              <Select
                label="KIP-K"
                clearable
                data={[
                  { value: "ya", label: "Ya" },
                  { value: "tidak", label: "Tidak" },
                ]}
                value={form.kipK == null ? null : form.kipK ? "ya" : "tidak"}
                onChange={(v) => set({ kipK: v == null ? null : v === "ya" })}
              />
            </Stack>
          </>
        )}
        {form.isMentor && (
          <Select
            label="Koordinator"
            description="Boleh dikosongkan."
            searchable
            clearable
            data={(coordinators.data ?? [])
              .filter((c) => c.status !== "inactive")
              .map((c) => ({ value: String(c.userId), label: c.name }))}
            value={form.coordinatorUserId}
            onChange={(v) => set({ coordinatorUserId: v })}
          />
        )}
        {save.isError && <Alert color="red">{errorMessage(save.error)}</Alert>}
        <Button
          leftSection={<IconUserPlus size={18} />}
          disabled={noRole}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          Tambahkan sebagai peserta
        </Button>
      </Stack>
    </Paper>
  );
}

/** Super Admin: find a kaderisasi member and enrol them with roles. */
export function AddParticipantPage() {
  const { staff } = useAuth();
  const allowed = !!staff?.permissions.includes(ADD_PARTICIPANT_PERMISSION);
  const [q, setQ] = useState("");
  const [debounced] = useDebouncedValue(q.trim(), 300);
  const [selected, setSelected] = useState<MemberCandidate | null>(null);
  const search = useQuery({
    queryKey: ["staff", "members", debounced],
    queryFn: () => staffApi.searchMembers(debounced),
    enabled: allowed && debounced.length >= MIN_QUERY,
    placeholderData: (prev) => prev,
  });

  if (!allowed)
    return (
      <Screen title="Tambah peserta" back="/kelola/peserta">
        <EmptyState
          title="Khusus Super Admin"
          description="Menambah peserta dari data anggota hanya untuk Super Admin. Gunakan Impor peserta untuk menambah lewat CSV."
        />
      </Screen>
    );

  const results = (
    <Stack gap="sm">
      <TextInput
        type="search"
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect="off"
        autoFocus
        placeholder="Nama, email, atau nomor anggota"
        leftSection={<IconSearch size={18} />}
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
        aria-label="Cari anggota kaderisasi"
      />
      {debounced.length < MIN_QUERY ? (
        <Note>
          Ketik minimal {MIN_QUERY} huruf. Pencarian mencakup semua anggota
          website kaderisasi, bukan hanya peserta Perintis.
        </Note>
      ) : (
        <Loadable query={search}>
          {(members) =>
            members.length ? (
              <>
                <Text size="xs" c="dimmed" px={4}>
                  {members.length === 20
                    ? "20 hasil teratas · perjelas kata kunci bila belum ketemu"
                    : `${members.length} anggota`}
                </Text>
                <ListGroup>
                  {members.map((m) => (
                    <ResultRow
                      key={m.userId}
                      member={m}
                      selected={selected?.userId === m.userId}
                      onSelect={() => setSelected(m)}
                    />
                  ))}
                </ListGroup>
              </>
            ) : (
              <EmptyState
                title="Anggota tidak ditemukan"
                description="Belum punya akun kaderisasi? Tambahkan lewat Impor peserta dengan emailnya."
                action={
                  <Anchor
                    component={Link}
                    to="/kelola/impor"
                    size="sm"
                    fw={600}
                  >
                    Buka Impor peserta
                  </Anchor>
                }
              />
            )
          }
        </Loadable>
      )}
    </Stack>
  );

  return (
    <Screen
      title="Tambah peserta"
      subtitle="Dari data anggota kaderisasi"
      back="/kelola/peserta"
      width="wide"
    >
      <Grid gap="lg">
        <Grid.Col
          span={{ base: 12, md: 5 }}
          // On phones the form replaces the list once a member is picked.
          display={{ base: selected ? "none" : undefined, md: "block" }}
        >
          {results}
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          {selected ? (
            <div className="stickyAside">
              <AddForm
                key={selected.userId}
                member={selected}
                onCancel={() => setSelected(null)}
              />
            </div>
          ) : (
            <Paper p="lg" visibleFrom="md">
              <Title order={3}>Pilih anggota</Title>
              <Text size="sm" c="dimmed" mt="xs">
                Cari di kiri, lalu pilih orangnya untuk menetapkan peran.
                Anggota yang sudah menjadi peserta dibuka di halaman pesertanya.
              </Text>
            </Paper>
          )}
        </Grid.Col>
      </Grid>
    </Screen>
  );
}
