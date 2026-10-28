import { Table, UnstyledButton } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconChevronDown,
  IconChevronUp,
  IconSelector,
} from "@tabler/icons-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

const DESKTOP = "(min-width: 62em)";

/** True on desktop widths (same breakpoint as the sidebar layout). */
export function useDesktop() {
  return useMediaQuery(DESKTOP, window.matchMedia(DESKTOP).matches, {
    getInitialValueInEffect: false,
  });
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Makes the column sortable. */
  sortValue?: (row: T) => string | number;
  width?: number | string;
  /** Keep the cell on one line (dates, counts, buttons). */
  nowrap?: boolean;
}

/** Desktop table with click-to-sort headers; rows open `rowHref` when given. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  minWidth = 720,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  rowHref?: (row: T) => string;
  /** Below this width the table scrolls sideways. */
  minWidth?: number;
}) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), "id")) * sort!.dir
      );
    });
  }, [rows, columns, sort]);

  return (
    <Table.ScrollContainer minWidth={minWidth}>
      <Table
        highlightOnHover={!!rowHref}
        verticalSpacing="sm"
        horizontalSpacing="md"
        bg="white"
        style={{ borderRadius: "var(--mantine-radius-md)" }}
        withTableBorder
        borderColor="var(--surface-border)"
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const SortIcon = !active
                ? IconSelector
                : sort.dir === 1
                  ? IconChevronUp
                  : IconChevronDown;
              return (
                <Table.Th
                  key={c.key}
                  w={c.width}
                  aria-sort={
                    active
                      ? sort.dir === 1
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {c.sortValue ? (
                    <UnstyledButton
                      fw={700}
                      fz="sm"
                      style={{ display: "inline-flex", gap: 4 }}
                      onClick={() =>
                        setSort(
                          active
                            ? { key: c.key, dir: sort.dir === 1 ? -1 : 1 }
                            : { key: c.key, dir: 1 },
                        )
                      }
                    >
                      {c.header}
                      <SortIcon size={16} aria-hidden="true" />
                    </UnstyledButton>
                  ) : (
                    c.header
                  )}
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sorted.map((row) => (
            <Table.Tr
              key={rowKey(row)}
              style={rowHref ? { cursor: "pointer" } : undefined}
              onClick={rowHref ? () => navigate(rowHref(row)) : undefined}
            >
              {columns.map((c) => (
                <Table.Td
                  key={c.key}
                  fz="sm"
                  className={c.nowrap ? "nowrapCell" : undefined}
                >
                  {c.render(row)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
