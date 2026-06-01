import { ChevronDownIcon, TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Code,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  chakra,
  useDisclosure,
} from "@chakra-ui/react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  NotaRow,
  POLYGON_REGISTRAR_ADDRESS,
} from "../../../hooks/usePublicNotas";

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

const truncateAddress = (address: string): string =>
  address && address.length > 10
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;

const openSeaUrlFor = (notaId: string): string =>
  `https://opensea.io/assets/matic/${POLYGON_REGISTRAR_ADDRESS}/${notaId}`;

// tokenURI returns either a base64- or utf8-encoded data URI of JSON metadata.
const decodeTokenUri = (uri: string): string => {
  try {
    const base64Marker = "base64,";
    const base64Index = uri.indexOf(base64Marker);
    if (base64Index >= 0) {
      const decoded = atob(uri.slice(base64Index + base64Marker.length));
      return JSON.stringify(JSON.parse(decoded), null, 2);
    }
    const utf8Marker = "utf8,";
    const utf8Index = uri.indexOf(utf8Marker);
    if (utf8Index >= 0) {
      return JSON.stringify(
        JSON.parse(uri.slice(utf8Index + utf8Marker.length)),
        null,
        2
      );
    }
    return uri;
  } catch {
    return uri;
  }
};

interface NotaTableProps {
  /** undefined => loading state, [] => empty state. */
  rows?: NotaRow[];
  /** Fetches a nota's tokenURI for the "View metadata" action. */
  getTokenUri?: (notaId: string) => Promise<string>;
}

export function NotaTable({ rows, getTokenUri }: NotaTableProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const openMetadata = async (notaId: string) => {
    setSelectedId(notaId);
    setMetadata(null);
    onOpen();
    if (!getTokenUri) {
      return;
    }
    setIsFetching(true);
    try {
      const uri = await getTokenUri(notaId);
      setMetadata(decodeTokenUri(uri));
    } catch {
      setMetadata("Failed to load metadata");
    } finally {
      setIsFetching(false);
    }
  };

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
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Nota ID</Th>
            <Th>Owner</Th>
            <Th>Currency</Th>
            <Th isNumeric>Escrow</Th>
            <Th>Hook</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.notaId}>
              <Td>{row.notaId}</Td>
              <Td>{truncateAddress(row.owner)}</Td>
              <Td>{row.currency}</Td>
              <Td isNumeric>{row.escrow}</Td>
              <Td>{truncateAddress(row.hook)}</Td>
              <Td>
                <Menu>
                  <MenuButton
                    as={Button}
                    size="sm"
                    rightIcon={<ChevronDownIcon />}
                  >
                    See more
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => openMetadata(row.notaId)}>
                      View metadata
                    </MenuItem>
                    <MenuItem
                      as={Link}
                      href={openSeaUrlFor(row.notaId)}
                      isExternal
                    >
                      View on OpenSea
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nota #{selectedId} metadata</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {isFetching ? (
              <Center py={6}>
                <Spinner />
              </Center>
            ) : (
              <Code
                display="block"
                whiteSpace="pre-wrap"
                wordBreak="break-all"
                p={3}
                borderRadius="md"
                w="100%"
              >
                {metadata ?? "No metadata"}
              </Code>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
