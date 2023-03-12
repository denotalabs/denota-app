import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import CurrencyIcon from "../../designSystem/CurrencyIcon";
import RoundedButton from "../../designSystem/RoundedButton";

export function ConfirmSidePane() {
  const { formData } = useNotaForm();
  const createdLocaleDate = useMemo(() => {
    return new Date().toLocaleDateString();
  }, []);
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
              Payer
            </Text>
            <ArrowForwardIcon mx={2} />
            <Text
              fontWeight={600}
              fontSize={"xl"}
              textOverflow="clip"
              noOfLines={1}
            >
              Payee
            </Text>
          </HStack>

          <HStack>
            <Text fontWeight={400} fontSize={"xl"} my={0}>
              10000 DAI
            </Text>

            <CurrencyIcon currency="DAI" />
          </HStack>
        </Flex>
      </Box>
      <RoundedButton alignSelf="flex-end">Submit</RoundedButton>
    </VStack>
  );
}
