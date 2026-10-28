import { ActionIcon, Chip, Group, Stack, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconFileImport, IconSearch } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { staffApi } from "@/api/endpoints";
import { Screen } from "@/components/layout/Screen";
import {
  Avatarish,
  EmptyState,
  LinkRow,
  Loadable,
  StatusBadge,
} from "@/components/ui";
import { PARTICIPANT_STATUS, ROLE_LABEL } from "@/content/labels";

export function ParticipantsPage() {
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
      title="Data peserta"
      subtitle="Mentee, mentor & kelompok, koordinator"
      actions={
        <ActionIcon
          component={Link}
          to="/kelola/impor"
          variant="white"
          aria-label="Impor peserta"
        >
          <IconFileImport size={22} />
        </ActionIcon>
      }
    >
      <Stack gap="sm">
        <TextInput
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
                <Text size="xs" c="dimmed">
                  {rows.length} peserta
                </Text>
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
                        <Group gap={6}>
                          <StatusBadge {...PARTICIPANT_STATUS[r.status]} />
                          {!r.hasAccount && (
                            <StatusBadge
                              label="Akun belum aktif"
                              tone="gray"
                              variant="outline"
                            />
                          )}
                          {r.roles.includes("mentee") && !r.clubOk && (
                            <StatusBadge
                              label="Belum ada club"
                              tone="orange"
                              variant="outline"
                            />
                          )}
                        </Group>
                      </Stack>
                    }
                  />
                ))}
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
