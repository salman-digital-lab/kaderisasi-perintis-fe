import { Paper, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import classes from "./auth.module.css";

/** Same shape as kaderisasi-web-fe's AuthLayout: logo, card, help link. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className={classes.main}>
      <div className={classes.logo}>
        <img src="/bmka_logo_color.png" alt="BMKA Salman ITB" width={150} />
      </div>
      <Paper p="lg">
        <header className={classes.header}>
          <Text size="xs" fw={700} c="blue.8" tt="uppercase" lts={0.6}>
            Pembinaan Beasiswa Perintis
          </Text>
          <Title order={1} size="h2" mt={4}>
            {title}
          </Title>
          <Text c="dimmed" mt="xs" size="sm">
            {description}
          </Text>
        </header>
        {children}
      </Paper>
      {footer}
      <Text c="dimmed" size="sm" ta="center" mt="lg">
        Butuh bantuan?{" "}
        <a href="https://wa.me/6285156168499" className={classes.link}>
          Hubungi admin melalui WhatsApp
        </a>
        .
      </Text>
    </main>
  );
}
