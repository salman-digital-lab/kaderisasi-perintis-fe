import {
  Badge,
  Button,
  Group,
  Paper,
  Radio,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconLogout,
  IconRefresh,
  IconShieldCheck,
  IconUserCircle,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { USE_MOCK } from "@/api/client";
import { useAuth, useMe } from "@/auth/AuthProvider";
import { Screen } from "@/components/layout/Screen";
import { Avatarish, KeyValue, Section } from "@/components/ui";
import { ROLE_LABEL } from "@/content/labels";
import { ROLE_HOME } from "@/lib/roles";
import { CLOCK_PRESETS, fmtDateTime, getClock, setClock } from "@/lib/time";

/** Simulated date and data reset, only while the mock API is on. */
function DemoSettings() {
  const queryClient = useQueryClient();
  const [clock, setClockState] = useState(getClock());
  if (!USE_MOCK) return null;
  return (
    <Section
      title="Mode demo"
      description="Data contoh disimpan di peramban ini; belum ada backend."
    >
      <Stack gap="lg">
        <Radio.Group
          label="Tanggal simulasi"
          description="Ganti tanggal untuk mencoba tenggat (tgl 5, 12, 15)."
          value={clock}
          onChange={(v) => {
            setClock(v);
            setClockState(v);
            queryClient.invalidateQueries();
          }}
        >
          <Stack gap="xs" mt="xs">
            {CLOCK_PRESETS.map((p) => (
              <Radio key={p.value} value={p.value} label={p.label} />
            ))}
          </Stack>
        </Radio.Group>
        <Button
          variant="light"
          color="orange"
          leftSection={<IconRefresh size={18} />}
          onClick={() =>
            modals.openConfirmModal({
              title: "Kembalikan data contoh?",
              centered: true,
              children: (
                <Text size="sm">
                  Semua perubahan demo di peramban ini dihapus dan data awal
                  dimuat ulang.
                </Text>
              ),
              labels: { confirm: "Kembalikan", cancel: "Batal" },
              confirmProps: { color: "orange" },
              onConfirm: async () => {
                const { resetDb } = await import("@/api/mock");
                resetDb();
                queryClient.invalidateQueries();
              },
            })
          }
        >
          Kembalikan data contoh
        </Button>
      </Stack>
    </Section>
  );
}

export function AccountPage() {
  const me = useMe();
  const auth = useAuth();
  const navigate = useNavigate();
  return (
    <Screen title="Akun">
      <Stack gap="lg">
        <Paper p="lg">
          <Group wrap="nowrap">
            <Avatarish name={me.profile.name} size={52} />
            <div style={{ minWidth: 0 }}>
              <Title order={3}>{me.profile.name}</Title>
              <Text size="sm" c="dimmed" truncate>
                {me.profile.email}
              </Text>
            </div>
          </Group>
        </Paper>
        <Section
          title="Peran"
          description="Peran dibaca dari data peserta setiap kali dibuka."
        >
          <Radio.Group
            value={auth.activeRole ?? ""}
            onChange={(v) => {
              const role = v as keyof typeof ROLE_HOME;
              auth.setActiveRole(role);
              navigate(ROLE_HOME[role]);
            }}
          >
            <Stack gap="xs">
              {me.roles.map((r) => (
                <Radio.Card key={r} value={r} p="sm" radius="md">
                  <Group wrap="nowrap" gap="sm">
                    <Radio.Indicator />
                    <Text fw={600} size="sm">
                      {ROLE_LABEL[r]}
                    </Text>
                    {r === auth.activeRole && (
                      <Badge size="sm" variant="light" ml="auto">
                        Aktif
                      </Badge>
                    )}
                  </Group>
                </Radio.Card>
              ))}
            </Stack>
          </Radio.Group>
          <KeyValue
            items={[
              ["Mentor", me.mentor?.name],
              ["Koordinator", me.coordinator?.name],
            ]}
          />
        </Section>
        <DemoSettings />
        <Button
          variant="default"
          component={Link}
          to={auth.hasStaff ? "/kelola" : "/staf/masuk"}
          leftSection={<IconShieldCheck size={18} />}
        >
          {auth.hasStaff ? "Buka area pengelola" : "Masuk sebagai staf"}
        </Button>
        <Button
          variant="light"
          color="red"
          leftSection={<IconLogout size={18} />}
          onClick={() => {
            auth.signOutParticipant();
            navigate("/masuk", { replace: true });
          }}
        >
          Keluar
        </Button>
      </Stack>
    </Screen>
  );
}

export function StaffAccountPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const staff = auth.staff!;
  return (
    <Screen title="Akun staf">
      <Stack gap="lg">
        <Paper p="lg">
          <Group wrap="nowrap">
            <Avatarish name={staff.name} size={52} />
            <div style={{ minWidth: 0 }}>
              <Title order={3}>{staff.name}</Title>
              <Text size="sm" c="dimmed" truncate>
                {staff.email}
              </Text>
              <Group gap={4} mt={6}>
                {staff.roles.map((r) => (
                  <Badge key={r} size="sm" variant="light">
                    {r}
                  </Badge>
                ))}
              </Group>
            </div>
          </Group>
        </Paper>
        <Section title="Izin">
          <Stack gap={4}>
            {staff.permissions.map((p) => (
              <Text key={p} size="sm" ff="monospace">
                {p}
              </Text>
            ))}
          </Stack>
        </Section>
        <Section title="Waktu simulasi">
          <Text size="sm">{fmtDateTime(getClock())}</Text>
        </Section>
        <DemoSettings />
        <Button
          variant="default"
          component={Link}
          to={auth.hasParticipant ? "/" : "/masuk"}
          leftSection={<IconUserCircle size={18} />}
        >
          {auth.hasParticipant ? "Buka area peserta" : "Masuk sebagai peserta"}
        </Button>
        <Button
          variant="light"
          color="red"
          leftSection={<IconLogout size={18} />}
          onClick={() => {
            auth.signOutStaff();
            navigate("/staf/masuk", { replace: true });
          }}
        >
          Keluar
        </Button>
      </Stack>
    </Screen>
  );
}
