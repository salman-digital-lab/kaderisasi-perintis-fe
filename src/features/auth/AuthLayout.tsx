import { Paper, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { DisplayTitle, PerintisMark, Quoted } from "@/components/brand";
import classes from "./auth.module.css";

/** Sky header band with the Perintis mark; the form card overlaps it. */
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
      <header className={classes.hero}>
        <div className={classes.brand}>
          <PerintisMark size={48} />
          <div>
            <Text fw={800} ff="Montserrat, sans-serif" size="lg" lh={1.2}>
              Beasiswa Perintis
            </Text>
            <Text size="sm" opacity={0.92}>
              Rumah Amal Salman · BMKA Salman ITB
            </Text>
          </div>
        </div>
        <DisplayTitle size={34}>{title}</DisplayTitle>
        <Quoted>Pembinaan Perintis</Quoted>
      </header>
      <div className={classes.body}>
        <Paper p="lg" radius="lg" withBorder={false} className="raised">
          <Text c="dimmed" size="sm" mb="lg">
            {description}
          </Text>
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
        <p className={classes.strip}>
          Merintis masa depan bersama <b>Beasiswa Perintis</b>
        </p>
      </div>
    </main>
  );
}
