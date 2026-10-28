import {
  ActionIcon,
  Anchor,
  Chip,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconFileImport, IconSearch, IconUserPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { staffApi } from "@/api/endpoints";
import { ADD_PARTICIPANT_PERMISSION, type ParticipantRow } from "@/api/types";
import { useAuth } from "@/auth/AuthProvider";
import { DataTable, useTableLayout, type Column } from "@/components/DataTable";
import { Screen } from "@/components/layout/Screen";
import {
  Avatarish,
  EmptyState,
  LinkRow,
  ListGroup,
  Loadable,
  StatusBadge,
} from "@/components/ui";
import {
  menteeDataMissing,
  PARTICIPANT_STATUS,
  ROLE_LABEL,
} from "@/content/labels";

function Badges({ r }: { r: ParticipantRow }) {
  return (
    <Group gap={6}>
      <StatusBadge {...PARTICIPANT_STATUS[r.status]} />
      {!r.hasAccount && (
        <StatusBadge label="Akun belum aktif" tone="gray" variant="outline" />
      )}
      {r.roles.includes("mentee") && menteeDataMissing(r) && (
        <StatusBadge label="Data belum lengkap" tone="red" variant="outline" />
      )}
      {r.roles.includes("mentee") && !r.clubOk && (
        <StatusBadge label="Belum ada club" tone="orange" variant="outline" />
      )}
    </Group>
  );
}

const COLUMNS: Column<ParticipantRow>[] = [
  {
    key: "name",
    header: "Nama",
    sortValue: (r) => r.name,
    render: (r) => (
      <Group gap="sm" wrap="nowrap">
        <Avatarish name={r.name} size={34} />
        <div style={{ minWidth: 0 }}>
          <Anchor
            component={Link}
            to={`/kelola/peserta/${r.userId}`}
            fw={700}
            c="inherit"
            onClick={(e) => e.stopPropagation()}
          >
            {r.name}
          </Anchor>
          <Text size="xs" c="dimmed" truncate>
            {r.email}
          </Text>
        </div>
      </Group>
    ),
  },
  {
    key: "roles",
    header: "Peran",
    sortValue: (r) => r.roles.map((x) => ROLE_LABEL[x]).join(" + "),
    render: (r) => r.roles.map((x) => ROLE_LABEL[x]).join(" + "),
  },
  {
    key: "nim",
    header: "NIM",
    sortValue: (r) => r.nim ?? "",
    render: (r) => r.nim ?? "—",
  },
  {
    key: "group",
    header: "Mentor / kelompok",
    sortValue: (r) => r.mentorName ?? "",
    render: (r) =>
      [
        r.roles.includes("mentee") ? `Mentor ${r.mentorName ?? "—"}` : "",
        r.roles.includes("mentor") ? `${r.menteeCount} mentee` : "",
      ]
        .filter(Boolean)
        .join(" · ") || "—",
  },
  {
    key: "coordinator",
    header: "Koordinator",
    sortValue: (r) => r.coordinatorName ?? "",
    render: (r) => r.coordinatorName ?? "—",
  },
  {
    key: "status",
    header: "Status",
    sortValue: (r) => PARTICIPANT_STATUS[r.status].label,
    render: (r) => <Badges r={r} />,
  },
];

export function ParticipantsPage() {
  const desktop = useTableLayout();
  const { staff } = useAuth();
  const canAdd = !!staff?.permissions.includes(ADD_PARTICIPANT_PERMISSION);
  const [params, setParams] = useSearchParams();
  const role = params.get("role") ?? "";
  const status = params.get("status") ?? "";
  const [q, setQ] = useState("");
  const [debounced] = useDebouncedValue(q, 250);
  const query = useQuery({
    queryKey: ["staff", "participants", { role, status, q: debounced }],
    queryFn: () => staffApi.participants({ role, status, q: debounced }),
    placeholderData: (prev) => prev,
  });
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <Screen
      width="wide"
      title="Data peserta"
      subtitle="Mentee, mentor & kelompok, koordinator"
      actions={
        <Group gap="xs" wrap="nowrap">
          {canAdd && (
            <ActionIcon
              component={Link}
              to="/kelola/peserta/tambah"
              variant="white"
              aria-label="Tambah peserta dari data anggota"
              title="Tambah peserta dari data anggota"
            >
              <IconUserPlus size={22} />
            </ActionIcon>
          )}
          <ActionIcon
            component={Link}
            to="/kelola/impor"
            variant="white"
            aria-label="Impor peserta"
            title="Impor peserta"
          >
            <IconFileImport size={22} />
          </ActionIcon>
        </Group>
      }
    >
      <Stack gap="sm">
        <TextInput
          maw={desktop ? 420 : undefined}
          type="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="Cari nama, email, atau NIM"
          leftSection={<IconSearch size={18} />}
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          aria-label="Cari peserta"
        />
        <Chip.Group
          value={role}
          onChange={(v) => setFilter("role", v as string)}
        >
          <Group gap={6} wrap="nowrap" className="hscroll">
            <Chip value="" size="sm">
              Semua
            </Chip>
            <Chip value="mentee" size="sm">
              Mentee
            </Chip>
            <Chip value="mentor" size="sm">
              Mentor
            </Chip>
            <Chip value="coordinator" size="sm">
              Koordinator
            </Chip>
          </Group>
        </Chip.Group>
        <Chip.Group
          value={status}
          onChange={(v) => setFilter("status", v as string)}
        >
          <Group gap={6} wrap="nowrap" className="hscroll">
            <Chip value="" size="sm">
              Semua status
            </Chip>
            {Object.entries(PARTICIPANT_STATUS).map(([k, v]) => (
              <Chip key={k} value={k} size="sm">
                {v.label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
        <Loadable query={query}>
          {(rows) =>
            rows.length ? (
              <Stack gap="xs">
                <Text size="xs" c="dimmed" px={4}>
                  {rows.length} peserta
                </Text>
                {desktop ? (
                  <DataTable
                    columns={COLUMNS}
                    rows={rows}
                    rowKey={(r) => r.userId}
                    rowHref={(r) => `/kelola/peserta/${r.userId}`}
                  />
                ) : (
                  <ListGroup>
                    {rows.map((r) => (
                      <LinkRow
                        key={r.userId}
                        to={`/kelola/peserta/${r.userId}`}
                        icon={<Avatarish name={r.name} />}
                        title={r.name}
                        description={
                          <Stack gap={4}>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {r.roles.map((x) => ROLE_LABEL[x]).join(" + ")}
                              {r.nim ? ` · ${r.nim}` : ""}
                              {r.roles.includes("mentee")
                                ? ` · mentor ${r.mentorName ?? "—"}`
                                : ""}
                              {r.roles.includes("mentor")
                                ? ` · ${r.menteeCount} mentee`
                                : ""}
                            </Text>
                            <Badges r={r} />
                          </Stack>
                        }
                      />
                    ))}
                  </ListGroup>
                )}
              </Stack>
            ) : (
              <EmptyState
                title="Tidak ada peserta"
                description="Ubah pencarian atau filter."
              />
            )
          }
        </Loadable>
      </Stack>
    </Screen>
  );
}
