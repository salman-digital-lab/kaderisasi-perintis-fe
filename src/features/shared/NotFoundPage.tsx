import { Button } from "@mantine/core";
import { IconMapOff } from "@tabler/icons-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/ui";

export function NotFoundPage({ message }: { message?: string }) {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <EmptyState
        icon={IconMapOff}
        title="Halaman tidak ditemukan"
        description={message ?? "Alamat ini tidak ada atau di luar peranmu."}
        action={
          <Button component={Link} to="/" mt="sm">
            Ke beranda
          </Button>
        }
      />
    </div>
  );
}
