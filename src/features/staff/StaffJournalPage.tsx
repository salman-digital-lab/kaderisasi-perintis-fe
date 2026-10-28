import { Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { staffApi } from "@/api/endpoints";
import { Screen } from "@/components/layout/Screen";
import { Loadable, MultilineText, StatusBadge } from "@/components/ui";
import {
  CATEGORY_LABEL,
  FLAG_STATUS,
  FLAG_TRIGGER,
  JOURNAL_STATUS,
} from "@/content/labels";
import { fmtDateTime, monthLabel } from "@/lib/time";
import { JournalContent } from "@/features/shared/JournalContent";

/** Pengelola reads the full lapbul (perintis.content.read); read-only. */
export function StaffJournalPage() {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: ["staff", "journal", id],
    queryFn: () => staffApi.journal(Number(id)),
  });
  const d = query.data;
  return (
    <Screen
      title={d?.mentee.name ?? "Lapbul"}
      subtitle={d ? `Lapbul ${monthLabel(d.journal.month)}` : undefined}
      back="/kelola/tindak-lanjut"
    >
      <Loadable query={query}>
        {(data) => {
          const j = data.journal;
          return (
            <Stack gap="lg">
              <Paper p="lg">
                <Text size="sm" c="dimmed">
                  {data.mentee.university} · T{data.mentee.tingkat} ·{" "}
                  {CATEGORY_LABEL[data.mentee.category]}
                </Text>
                <Group gap={6} mt={6}>
                  <StatusBadge {...JOURNAL_STATUS[j.status]} />
                  {j.isLate && <StatusBadge label="Terlambat" tone="orange" />}
                  {j.flag && <StatusBadge {...FLAG_STATUS[j.flag.status]} />}
                </Group>
                {j.submittedAt && (
                  <Text size="xs" c="dimmed" mt={6}>
                    Dikirim {fmtDateTime(j.submittedAt)}
                  </Text>
                )}
              </Paper>
              {j.flag && (
                <Paper p="lg">
                  <Title order={4}>Bendera kesejahteraan</Title>
                  <Text size="sm">{FLAG_TRIGGER[j.flag.trigger]}</Text>
                  {j.flag.privateNote && (
                    <>
                      <Text size="xs" fw={700} c="dimmed" mt="xs">
                        Catatan privat mentor ({j.flag.handledBy})
                      </Text>
                      <MultilineText size="sm">
                        {j.flag.privateNote}
                      </MultilineText>
                    </>
                  )}
                </Paper>
              )}
              {j.response && (
                <Paper p="lg">
                  <Title order={4} mb="xs">
                    Tanggapan mentor
                  </Title>
                  <Text size="xs" c="dimmed">
                    {j.response.respondedBy} ·{" "}
                    {fmtDateTime(j.response.respondedAt)}
                  </Text>
                  <MultilineText size="sm" mt="xs">
                    {j.response.appreciation}
                  </MultilineText>
                  <MultilineText size="sm" mt="xs">
                    {j.response.text}
                  </MultilineText>
                  {j.response.flagReason && (
                    <>
                      <Text size="xs" fw={700} c="red.8" mt="sm">
                        Alasan ditandai ke pengelola
                      </Text>
                      <MultilineText size="sm">
                        {j.response.flagReason}
                      </MultilineText>
                    </>
                  )}
                </Paper>
              )}
              <JournalContent
                journal={j}
                previousTargets={data.previousTargets}
                showSensitive
              />
            </Stack>
          );
        }}
      </Loadable>
    </Screen>
  );
}
