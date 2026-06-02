import {
  Button,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { usePublicNotas } from "../../hooks/usePublicNotas";
import { NotaTable } from "./table/NotaTable";

/** Recent notas from RPC (no wallet / no subgraph required). */
function PublicNotas() {
  const { notas, page, isLoading, hasNewer, hasOlder, showNewer, showOlder } =
    usePublicNotas();

  return (
    <VStack
      width="95%"
      mt={{ base: 6, lg: 12 }}
      p={4}
      borderRadius="30px"
      gap={3}
      align="stretch"
      bg="brand.100"
    >
      <Heading size="md">Recent Notas</Heading>
      <NotaTable rows={notas} />
      <HStack justifyContent="space-between">
        <Button
          onClick={showNewer}
          isDisabled={!hasNewer || isLoading}
          size="sm"
        >
          Newer
        </Button>
        <Text fontSize="sm">Page {page + 1}</Text>
        <Button
          onClick={showOlder}
          isDisabled={!hasOlder || isLoading}
          size="sm"
        >
          Older
        </Button>
      </HStack>
    </VStack>
  );
}

export default PublicNotas;
