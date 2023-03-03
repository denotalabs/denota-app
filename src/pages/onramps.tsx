import { Center, VStack } from "@chakra-ui/react";

export default function OnrampsPage() {
  return (
    <Center w="100%">
      <VStack bg="brand.100" py={4} px={4} borderRadius="30px">
        <iframe
          style={{ borderRadius: "30px" }}
          src="https://buy.onramper.com"
          height="540px"
          width="360px"
          title="Onramper widget"
          allow="accelerometer; autoplay; camera; gyroscope; payment"
        ></iframe>
      </VStack>
    </Center>
  );
}
