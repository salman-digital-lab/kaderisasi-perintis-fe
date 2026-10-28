import { Button, Stack, Text } from "@mantine/core";
import { IconBrandWhatsapp, IconLogout } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { AuthLayout } from "./AuthLayout";

const ADMIN_WHATSAPP = "https://wa.me/6285156168499";

/**
 * Signed in, but not part of the programme: a participant without a
 * perintis_participants row, or an admin without the Pengelola Perintis role.
 */
export function NotEnrolledPage({
  kind,
  message,
}: {
  kind: "participant" | "staff";
  /** Extra reason, such as an inactive membership. */
  message?: string;
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const switchAccount = () => {
    if (kind === "participant") {
      auth.signOutParticipant();
      navigate("/masuk", { replace: true });
    } else {
      auth.signOutStaff();
      navigate("/staf/masuk", { replace: true });
    }
  };
  return (
    <AuthLayout
      title="Belum terdaftar"
      description={
        kind === "participant"
          ? "Kamu sudah masuk, tetapi akun ini belum terdaftar di program pembinaan Beasiswa Perintis."
          : "Kamu sudah masuk, tetapi akun admin ini belum bisa membuka halaman pengelola Perintis."
      }
    >
      <Stack gap="md">
        {message && <Text size="sm">{message}</Text>}
        <Text size="sm" c="dimmed">
          {kind === "participant"
            ? "Bila kamu penerima Beasiswa Perintis, pastikan memakai email yang sama dengan data beasiswa, atau minta pengelola mendaftarkan akunmu."
            : "Minta Super Admin menambahkan peran Pengelola Perintis ke akunmu."}
        </Text>
        <Button
          component="a"
          href={ADMIN_WHATSAPP}
          target="_blank"
          rel="noopener"
          leftSection={<IconBrandWhatsapp size={18} />}
          fullWidth
        >
          Hubungi admin
        </Button>
        <Button
          variant="default"
          leftSection={<IconLogout size={18} />}
          onClick={switchAccount}
          fullWidth
        >
          Ganti akun
        </Button>
      </Stack>
    </AuthLayout>
  );
}
