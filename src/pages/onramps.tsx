import {
  Center,
  Flex,
  Heading,
  ListItem,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";

export default function OnrampsPage() {
  return (
    <Center w="100%">
      <Flex
        flexDirection={{ base: "column", md: "row" }}
        alignItems={{ base: "flex-start", md: "center" }}
      >
        <VStack bg="brand.100" py={3} px={3} borderRadius="40px">
          <Heading fontSize="xl">Supported Tokens:</Heading>
          <UnorderedList fontSize="xl">
            <ListItem>USDC (Polygon)</ListItem>
            <ListItem>DAI (Polygon)</ListItem>
            <ListItem>wETH (Polygon)</ListItem>
          </UnorderedList>
          <iframe
            style={{ borderRadius: "30px" }}
            src="https://buy.onramper.com"
            height="540px"
            width="360px"
            title="Onramper widget"
            allow="accelerometer; autoplay; camera; gyroscope; payment"
          ></iframe>
        </VStack>
      </Flex>
    </Center>
  );
}
