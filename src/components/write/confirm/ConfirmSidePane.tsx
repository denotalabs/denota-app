import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useFormatAddress } from "../../../hooks/useFormatAddress";
import CurrencyIcon, { CheqCurrency } from "../../designSystem/CurrencyIcon";
import RoundedButton from "../../designSystem/RoundedButton";

export function ConfirmSidePane() {
  const { formData } = useNotaForm();
  const { formatAddress } = useFormatAddress();
  const { blockchainState } = useBlockchainData();

  const createdLocaleDate = useMemo(() => {
    return new Date().toLocaleDateString();
  }, []);

  const payer = useMemo(() => {
    if (!formData.address) {
      return undefined;
    }
    if (formData.mode === "invoice") {
      return formatAddress(formData.address);
    }
    return formatAddress(blockchainState.account);
  }, [blockchainState.account, formData.address, formData.mode, formatAddress]);

  const payee = useMemo(() => {
    if (!formData.address) {
      return undefined;
    }
    if (formData.mode === "invoice") {
      return formatAddress(blockchainState.account);
    }
    return formatAddress(formData.address);
  }, [blockchainState.account, formData.address, formData.mode, formatAddress]);

  return (
    <VStack
      w="365px"
      bg="brand.100"
      pb={4}
      px={4}
      borderRadius="30px"
      h="90vh"
      pt={10}
      justifyContent="space-between"
      display={{ base: "none", md: "flex" }}
    >
      <Box
        w="285px"
        h="180px"
        bg="linear-gradient(180deg, #6E7C9A, #202C4F)"
        borderRadius={20}
        px={6}
        pt={4}
        pb={3}
      >
        <Flex
          alignItems="flex-start"
          flexDirection="column"
          maxW="100%"
          w="100%"
          gap={2.5}
        >
          <Text textOverflow="clip" noOfLines={1} fontSize="lg">
            {createdLocaleDate}
          </Text>

          <HStack maxW="100%">
            <Text
              fontWeight={600}
              fontSize={"xl"}
              textOverflow="clip"
              noOfLines={1}
            >
              {payer ?? "Payer"}
            </Text>
            <ArrowForwardIcon mx={2} />
            <Text
              fontWeight={600}
              fontSize={"xl"}
              textOverflow="clip"
              noOfLines={1}
            >
              {payee ?? "Payee"}
            </Text>
          </HStack>

          <HStack>
            <Text fontWeight={400} fontSize={"xl"} my={0}>
              {formData.amount} DAI
            </Text>

            <CurrencyIcon
              currency={(formData.token ?? "DAI") as CheqCurrency}
            />
          </HStack>
        </Flex>
      </Box>
      <RoundedButton isDisabled={true} alignSelf="flex-end">
        Submit
      </RoundedButton>
    </VStack>
  );
}
