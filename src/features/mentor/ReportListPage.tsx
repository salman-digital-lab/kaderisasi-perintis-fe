import { Group, Stack, Text } from "@mantine/core";
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
import { REPORT_STATUS } from "@/content/labels";
import { deadlines, fmtDate, monthLabel, relativeDays } from "@/lib/time";

export function ReportListPage() {
  const query = useQuery({
    queryKey: ["p", "my-reports"],
    queryFn: participantApi.myReports,
  });
  return (
    <Screen
      title="Laporan mentoring"
      subtitle="Berita acara sesi bulanan"
      actions={<RoleSwitcher />}
    >
      <Loadable query={query}>
        {(items) =>
          items.length ? (
            <ListGroup>
              {items.map((item, i) => {
                const due = deadlines(item.month).reportDue;
                const pending =
                  item.status === "not_started" ||
                  item.status === "draft" ||
                  item.status === "returned";
                return (
                  <LinkRow
                    key={item.month}
                    to={`/laporan/${item.month}`}
                    title={`Sesi ${monthLabel(item.month)}`}
                    description={
                      <Stack gap={4}>
                        <Group gap={6}>
                          <StatusBadge {...REPORT_STATUS[item.status]} />
                          {item.isLate && (
                            <Text size="xs" c="orange.8" fw={600}>
                              Terlambat
                            </Text>
                          )}
                        </Group>
                        {i === 0 && pending && (
                          <Text size="xs" c="blue.8" fw={600}>
                            Tenggat {fmtDate(due, "D MMM")} ·{" "}
                            {relativeDays(due)}
                          </Text>
                        )}
                        {item.verifiedAt && (
                          <Text size="xs">
                            Diverifikasi {fmtDate(item.verifiedAt, "D MMM")}
                          </Text>
                        )}
                      </Stack>
                    }
                    right={item.reviewUnread ? <NewBadge /> : null}
                  />
                );
              })}
            </ListGroup>
          ) : (
            <EmptyState title="Belum ada bulan laporan" />
          )
        }
      </Loadable>
    </Screen>
  );
}
