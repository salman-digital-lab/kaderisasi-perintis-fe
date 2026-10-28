import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
  type TextProps,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconChevronRight,
  IconInbox,
  IconInfoCircle,
  type Icon,
} from "@tabler/icons-react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { errorMessage } from "@/api/errors";
import type { Pulse } from "@/api/types";
import type { Tone } from "@/content/labels";
import { PULSE_ITEMS } from "@/content/lapbulForm";
import classes from "./ui.module.css";

export function StatusBadge({
  label,
  tone,
  variant = "light",
}: {
  label: string;
  tone: Tone;
  variant?: "light" | "filled" | "outline" | "dot";
}) {
  return (
    <span className={classes.chip} data-tone={tone} data-variant={variant}>
      {variant === "light" && <span className={classes.chipDot} />}
      {label}
    </span>
  );
}

export function NewBadge() {
  return (
    <Badge color="red" variant="filled" size="sm">
      Baru
    </Badge>
  );
}

export function Section({
  title,
  description,
  action,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper p="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
        <Box>
          <Title order={3}>{title}</Title>
          {description && (
            <Text size="sm" c="dimmed" mt={2}>
              {description}
            </Text>
          )}
        </Box>
        {action}
      </Group>
      {children}
    </Paper>
  );
}

export function KeyValue({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className={classes.kv}>
      {items.map(([k, v]) => (
        <div key={k} className={classes.kvRow}>
          <dt>{k}</dt>
          <dd>{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MultilineText({
  children,
  ...props
}: { children: string | null | undefined } & TextProps) {
  return (
    <Text className="multiline" {...props}>
      {children?.trim() ? children : "—"}
    </Text>
  );
}

export function LinkRow({
  to,
  onClick,
  title,
  description,
  right,
  icon,
}: {
  to?: string;
  onClick?: () => void;
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  icon?: ReactNode;
}) {
  const inner = (
    <Group wrap="nowrap" gap="sm" className={classes.row}>
      {icon}
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text fw={600} lineClamp={1}>
          {title}
        </Text>
        {description && (
          <Text component="div" size="sm" c="dimmed" mt={2}>
            {description}
          </Text>
        )}
      </Box>
      {right}
      <IconChevronRight size={18} className={classes.chevron} />
    </Group>
  );
  return to ? (
    <UnstyledButton component={Link} to={to} className={classes.rowButton}>
      {inner}
    </UnstyledButton>
  ) : (
    <UnstyledButton onClick={onClick} className={classes.rowButton}>
      {inner}
    </UnstyledButton>
  );
}

export function EmptyState({
  icon: IconCmp = IconInbox,
  title,
  description,
  action,
}: {
  icon?: Icon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Stack align="center" gap="xs" py="xl" px="md" ta="center">
      <ThemeIcon size={48} radius="xl" variant="light" color="gray">
        <IconCmp size={26} />
      </ThemeIcon>
      <Text fw={700}>{title}</Text>
      {description && (
        <Text size="sm" c="dimmed" maw={320}>
          {description}
        </Text>
      )}
      {action}
    </Stack>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <Alert
      color="red"
      variant="light"
      icon={<IconAlertCircle size={20} />}
      title="Gagal memuat"
    >
      <Text size="sm">{errorMessage(error)}</Text>
      {onRetry && (
        <Button size="xs" variant="white" color="red" mt="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </Alert>
  );
}

/** Placeholder cards shaped like the content, instead of a lone spinner. */
export function PageLoader({ rows = 3 }: { rows?: number }) {
  return (
    <Stack gap="sm" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={classes.skeletonCard}>
          <Skeleton height={14} width="40%" radius="xl" />
          <Skeleton height={12} width="75%" radius="xl" mt={12} />
          <Skeleton height={12} width="55%" radius="xl" mt={8} />
        </div>
      ))}
    </Stack>
  );
}

/** Rows of LinkRow inside one card, split by hairlines. */
export function ListGroup({ children }: { children: ReactNode }) {
  return <div className={classes.list}>{children}</div>;
}

/** Quiet helper text for hints that don't need a boxed alert. */
export function Note({
  children,
  icon: IconCmp = IconInfoCircle,
}: {
  children: ReactNode;
  icon?: Icon;
}) {
  return (
    <div className={classes.note}>
      <IconCmp size={16} />
      <div>{children}</div>
    </div>
  );
}

/** Renders loading / error states and hands data to children. */
export function Loadable<T>({
  query,
  children,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <PageLoader />;
  if (query.isError)
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return <>{children(query.data)}</>;
}

const pulseColor = (v: number | null) =>
  v == null ? "gray" : v <= 2 ? "red" : v === 3 ? "yellow" : "green";

export function PulseBars({
  pulse,
  compact,
}: {
  pulse: Pulse;
  compact?: boolean;
}) {
  return (
    <div className={compact ? classes.pulseCompact : classes.pulse}>
      {PULSE_ITEMS.map((item) => {
        const v = pulse[item.key];
        return (
          <div key={item.key} className={classes.pulseItem}>
            {!compact && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {item.label}
              </Text>
            )}
            <div
              className={classes.pulseTrack}
              title={`${item.label}: ${v ?? "-"}`}
              aria-label={`${item.label}: ${v ?? "belum diisi"} dari 5`}
            >
              <div
                className={classes.pulseFill}
                style={{
                  width: `${((v ?? 0) / 5) * 100}%`,
                  background: `var(--mantine-color-${pulseColor(v)}-6)`,
                }}
              />
            </div>
            {!compact && (
              <Text size="xs" fw={700}>
                {v ?? "–"}
              </Text>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Avatarish({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <ThemeIcon size={size} radius="xl" variant="light" color="blue">
      <Text fw={700} size={size > 40 ? "lg" : "sm"}>
        {initials}
      </Text>
    </ThemeIcon>
  );
}
