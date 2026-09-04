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
import { useEnsNames } from "../../../hooks/useEnsNames";
import { NotaRow } from "../../../hooks/usePublicNotas";
import { hookDisplayName } from "../../../utils/notaActions/hookRegistry";

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

export function NotaTable({ rows }: NotaTableProps) {
  const router = useRouter();
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
            <Th>Currency</Th>
            <Th isNumeric>Escrow</Th>
            <Th>Payment Terms</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => {
            const hookName = hookDisplayName(row.hook);
            return (
              <Tr
                key={row.notaId}
                onClick={() => router.push(`/nota/${row.notaId}`)}
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
              >
                <Td>
                  {/* The real link: keyboard focus, and open-in-new-tab still
                      work even though the whole row is clickable. */}
                  <Link
                    as={NextLink}
                    href={`/nota/${row.notaId}`}
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
                <Td>{row.currency}</Td>
                <Td isNumeric>{row.escrow}</Td>
                <Td>
                  {hookName ?? (
                    <AddressDisplay
                      address={row.hook}
                      ensNames={ensNames}
                      fontSize="sm"
                    />
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
