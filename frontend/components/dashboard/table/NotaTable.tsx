import { TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Center,
  Link,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  chakra,
} from "@chakra-ui/react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import AddressDisplay from "../../../components/designSystem/AddressDisplay";
import { PaymentStatusChip } from "../../../components/designSystem/PaymentStatusChip";
import {
  NotaStatusExtras,
  useNotaStatusExtras,
} from "../../../hooks/fetchNotaStatusExtras";
import { useEnsNames } from "../../../hooks/useEnsNames";
import { NotaRow } from "../../../hooks/usePublicNotas";
import { hookDisplayName } from "../../../utils/notaActions/hookRegistry";
import {
  NotaDisplayStatus,
  needsRemoteStatusExtras,
  notaDisplayStatus,
} from "../../../utils/notaStatus";

export type DataTableProps<Data extends object> = {
  data: Data[];
  columns: ColumnDef<Data, any>[];
};

export function DataTable<Data extends object>({
  data,
  columns,
}: DataTableProps<Data>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <Table maxW="100%">
      <Thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <Tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              // see https://tanstack.com/table/v8/docs/api/core/column-def#meta to type this correctly
              const meta: any = header.column.columnDef.meta;
              return (
                <Th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  isNumeric={meta?.isNumeric}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}

                  <chakra.span pl="4">
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === "desc" ? (
                        <TriangleDownIcon aria-label="sorted descending" />
                      ) : (
                        <TriangleUpIcon aria-label="sorted ascending" />
                      )
                    ) : null}
                  </chakra.span>
                </Th>
              );
            })}
          </Tr>
        ))}
      </Thead>
      <Tbody>
        {table.getRowModel().rows.map((row) => (
          <Tr key={row.id}>
            {row.getVisibleCells().map((cell) => {
              // see https://tanstack.com/table/v8/docs/api/core/column-def#meta to type this correctly
              const meta: any = cell.column.columnDef.meta;
              return (
                <>
                  <Td key={cell.id} isNumeric={meta?.isNumeric}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}{" "}
                  </Td>
                  {/*  */}
                </>
              );
            })}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}

interface NotaTableProps {
  /** undefined => loading state, [] => empty state. */
  rows?: NotaRow[];
}

function rowNeedsExtras(row: NotaRow): boolean {
  return needsRemoteStatusExtras({
    hookAddress: row.hook,
    escrowHeld: row.escrowHeld,
    expiration: row.expiration,
    hasInteractionHistory: row.hasInteractionHistory,
  });
}

function statusForRow(
  row: NotaRow,
  extra: NotaStatusExtras | undefined,
  extrasReady: boolean
): NotaDisplayStatus | undefined {
  if (rowNeedsExtras(row) && !extrasReady) {
    return undefined;
  }
  return notaDisplayStatus({
    hookAddress: row.hook,
    metadata: extra?.metadata ?? null,
    escrowHeld: row.escrowHeld,
    interactions: [],
    hasInteractionHistory:
      row.hasInteractionHistory ?? extra?.hasInteractionHistory ?? false,
    expiration: row.expiration,
    wasCashed: row.wasCashed ?? extra?.wasCashed,
  });
}

export function NotaTable({ rows }: NotaTableProps) {
  const router = useRouter();
  const notaIds = useMemo(
    () => (rows ?? []).filter(rowNeedsExtras).map((row) => row.notaId),
    [rows]
  );
  const { extras, isLoaded: statusesLoaded } = useNotaStatusExtras(notaIds);
  const ensAddresses = useMemo(
    () => rows?.flatMap((row) => [row.owner, row.hook]) ?? [],
    [rows]
  );
  const ensNames = useEnsNames(ensAddresses);

  if (rows === undefined) {
    return (
      <Center w="100%" py={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (rows.length === 0) {
    return (
      <Center w="100%" py={10}>
        <Text>No notas found</Text>
      </Center>
    );
  }

  return (
    <Box w="100%" overflowX="auto">
      <Table size={{ base: "sm", md: "md" }}>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Owner</Th>
            <Th>Escrow</Th>
            <Th>Payment Terms</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => {
            const hookName = hookDisplayName(row.hook);
            const href = `/nota/${row.notaId}`;
            const status = statusForRow(
              row,
              extras.get(row.notaId),
              statusesLoaded
            );
            return (
              <Tr
                key={row.notaId}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey) {
                    window.open(href, "_blank", "noopener,noreferrer");
                    return;
                  }
                  router.push(href);
                }}
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
              >
                <Td>
                  {/* The real link: keyboard focus, and open-in-new-tab still
                      work even though the whole row is clickable. */}
                  <Link
                    as={NextLink}
                    href={href}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Open nota ${row.notaId}`}
                    color="inherit"
                    _hover={{ textDecoration: "underline" }}
                  >
                    {row.notaId}
                  </Link>
                </Td>
                <Td>
                  <AddressDisplay
                    address={row.owner}
                    ensNames={ensNames}
                    fontSize="sm"
                  />
                </Td>
                <Td whiteSpace="nowrap">
                  {row.escrow} {row.currency}
                </Td>
                <Td>
                  {hookName ?? (
                    <AddressDisplay
                      address={row.hook}
                      ensNames={ensNames}
                      fontSize="sm"
                    />
                  )}
                </Td>
                <Td>
                  <PaymentStatusChip status={status} />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
