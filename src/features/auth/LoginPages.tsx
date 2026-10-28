import {
  Alert,
  Anchor,
  Button,
  Divider,
  Modal,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { USE_MOCK } from "@/api/client";
import { participantApi, staffApi } from "@/api/endpoints";
import { errorMessage } from "@/api/errors";
import { DEMO_ACCOUNTS, DEMO_STAFF } from "@/api/mock/demoAccounts";
import { useAuth } from "@/auth/AuthProvider";
import { LinkRow } from "@/components/ui";
import { AuthLayout } from "./AuthLayout";
import classes from "./auth.module.css";

type Kind = "participant" | "staff";

function LoginForm({ kind }: { kind: Kind }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleOpen, google] = useDisclosure(false);
  const api = kind === "participant" ? participantApi : staffApi;
  const accounts = kind === "participant" ? DEMO_ACCOUNTS : DEMO_STAFF;
  const home = kind === "participant" ? "/" : "/kelola";

  const done = (token: string) => {
    if (kind === "participant") auth.signInParticipant(token);
    else auth.signInStaff(token);
    navigate(home, { replace: true });
  };

  const login = useMutation({
    mutationFn: (vars: {
      email: string;
      password?: string;
      google?: boolean;
    }) =>
      vars.google
        ? api.loginGoogle(vars.email)
        : api.login(vars.email, vars.password ?? ""),
    onSuccess: ({ token }) => done(token),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <>
      <Button
        fullWidth
        variant="default"
        leftSection={<IconBrandGoogle size={18} />}
        onClick={google.open}
      >
        Masuk dengan Google
      </Button>
      <Divider label="atau dengan email" labelPosition="center" my="md" />
      <form onSubmit={submit}>
        <Stack gap="sm">
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <PasswordInput
            label="Kata sandi"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          {login.isError && (
            <Alert color="red" variant="light">
              {errorMessage(login.error)}
            </Alert>
          )}
          <Button type="submit" loading={login.isPending} fullWidth mt="xs">
            Masuk
          </Button>
        </Stack>
      </form>

      <Modal
        opened={googleOpen}
        onClose={google.close}
        title="Pilih akun Google"
        centered
      >
        <Stack gap="xs">
          {USE_MOCK && (
            <Text size="sm" c="dimmed">
              Simulasi: login Google memakai akun demo.
            </Text>
          )}
          {accounts.map((a) => (
            <LinkRow
              key={a.email}
              title={a.label}
              description={a.email}
              onClick={() => {
                google.close();
                login.mutate({ email: a.email, google: true });
              }}
            />
          ))}
        </Stack>
      </Modal>

      {USE_MOCK && (
        <Paper p="sm" mt="lg" className={classes.demo}>
          <Text size="sm" fw={700} mb={4}>
            Akun demo
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            Data contoh disimpan di peramban ini. Pilih akun untuk langsung
            masuk.
          </Text>
          <Stack gap={6}>
            {accounts.map((a) => (
              <LinkRow
                key={a.email}
                title={a.label}
                description={a.hint}
                onClick={() =>
                  login.mutate({ email: a.email, password: "demo" })
                }
              />
            ))}
          </Stack>
        </Paper>
      )}
    </>
  );
}

export function LoginPage() {
  const { hasParticipant } = useAuth();
  if (hasParticipant) return <Navigate to="/" replace />;
  return (
    <AuthLayout
      title="Masuk"
      description="Gunakan akun Kaderisasi Salman yang sama. Mentee yang diimpor dengan email Google bisa langsung masuk dengan Google."
      footer={
        <Text ta="center" size="sm" mt="lg">
          Pengelola program?{" "}
          <Anchor component={Link} to="/staf/masuk" className={classes.link}>
            Masuk sebagai staf
          </Anchor>
        </Text>
      }
    >
      <LoginForm kind="participant" />
    </AuthLayout>
  );
}

export function StaffLoginPage() {
  const { hasStaff } = useAuth();
  if (hasStaff) return <Navigate to="/kelola" replace />;
  return (
    <AuthLayout
      title="Masuk staf"
      description="Untuk Pengelola Perintis. Memakai akun admin kaderisasi dengan role Pengelola Perintis."
      footer={
        <Text ta="center" size="sm" mt="lg">
          Mentee, mentor, atau koordinator?{" "}
          <Anchor component={Link} to="/masuk" className={classes.link}>
            Masuk di sini
          </Anchor>
        </Text>
      }
    >
      <LoginForm kind="staff" />
    </AuthLayout>
  );
}
