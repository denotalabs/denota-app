import { RepeatIcon } from "@chakra-ui/icons";
import {
  Center,
  HStack,
  IconButton,
  Select,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useNotaContext } from "../../context/NotasContext";
import { NotaRow } from "../../hooks/usePublicNotas";
import { useTokens } from "../../hooks/useTokens";
import PublicNotas from "./PublicNotas";
import { NotaTable } from "./table/NotaTable";

function MyNotas() {
  const {
    notas,
    refresh,
    setNotaField,
    isLoading,
    graphFailed,
    accountNotaBalance,
    balanceChecking,
    refreshBalance,
  } = useNotaContext();
  const { currencyForTokenId, displayNameForCurrency, weiAddressToDisplay } =
    useTokens();

  const usePublicView =
    !balanceChecking &&
    (accountNotaBalance === 0 || graphFailed);

  const subgraphRows: NotaRow[] | undefined = useMemo(() => {
    if (usePublicView || isLoading || notas === undefined) {
      return undefined;
    }
    return notas.map((nota) => ({
      notaId: nota.id,
      owner: nota.owner,
      currency: displayNameForCurrency(currencyForTokenId(nota.token)),
      escrow: weiAddressToDisplay(nota.escrowed, nota.token),
      hook: nota.module,
    }));
  }, [
    notas,
    isLoading,
    usePublicView,
    currencyForTokenId,
    displayNameForCurrency,
    weiAddressToDisplay,
  ]);

  if (balanceChecking) {
    return (
      <Center width="95%" minH="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (usePublicView) {
    return <PublicNotas />;
  }

  return (
    <VStack
      width="95%"
      p={6}
      borderRadius="30px"
      gap={6}
      align="stretch"
      bg="brand.100"
    >
      <HStack gap={2} justifyContent="space-between">
        <Select
          defaultValue={"all"}
          minW={0}
          w="120px"
          onChange={(event) => {
            setNotaField(event.target.value);
          }}
          focusBorderColor="clear"
        >
          <option value="all">All</option>
          <option value="notasReceived">Received</option>
          <option value="notasSent">Sent</option>
        </Select>
        <IconButton
          size="lg"
          aria-label="refresh"
          icon={<RepeatIcon />}
          onClick={() => {
            refreshBalance();
            refresh();
          }}
        />
      </HStack>
      <NotaTable rows={subgraphRows} />
    </VStack>
  );
}

export default MyNotas;
