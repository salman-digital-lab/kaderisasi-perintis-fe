import { Group, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { participantApi } from "@/api/endpoints";
import { Screen } from "@/components/layout/Screen";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import {
  EmptyState,
  LinkRow,
  ListGroup,
  Loadable,
  NewBadge,
  StatusBadge,
} from "@/components/ui";
import { JOURNAL_STATUS } from "@/content/labels";
import { fmtDate, monthLabel } from "@/lib/time";

export function JournalListPage() {
  const query = useQuery({
    queryKey: ["p", "journals"],
    queryFn: participantApi.myJournals,
  });
  return (
    <Screen
      title="Catatan Perjalanan"
      subtitle="Laporan bulanan & tanggapan mentor"
      actions={<RoleSwitcher />}
    >
      <Loadable query={query}>
        {(items) =>
          items.length ? (
            <ListGroup>
              {items.map((item) => (
                <LinkRow
                  key={item.month}
                  to={`/lapbul/${item.month}`}
                  title={monthLabel(item.month)}
                  description={
                    <Group gap={6}>
                      <StatusBadge {...JOURNAL_STATUS[item.status]} />
                      {item.isLate && (
                        <Text size="xs" c="orange.8" fw={600}>
                          Terlambat
                        </Text>
                      )}
                      {item.submittedAt && (
                        <Text size="xs">
                          Dikirim {fmtDate(item.submittedAt, "D MMM")}
                        </Text>
                      )}
                    </Group>
                  }
                  right={item.responseUnread ? <NewBadge /> : null}
                />
              ))}
            </ListGroup>
          ) : (
            <EmptyState
              title="Belum ada bulan laporan"
              description="Catatan Perjalanan Oktober 2026 dibuka 1 November 2026."
            />
          )
        }
      </Loadable>
    </Screen>
  );
}
