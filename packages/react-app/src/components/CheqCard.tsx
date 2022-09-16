import React from "react";
import { Box, Center, Heading, Text, Stack } from "@chakra-ui/react";

// id, recipient, amount, status, timestamp, token, expiry
export default function CheqCard() {
  return (
    <Center py={12}>
      <Box
        p={6}
        maxW={"330px"}
        w={"full"}
        boxShadow="sm"
        rounded={"lg"}
        borderWidth="1px"
        borderRadius="lg"
        zIndex={1}
      >
        <Stack direction={"row"} align={"right"}>
          <Stack>
            <Text
              color={"gray.500"}
              fontSize={"sm"}
              textTransform={"uppercase"}
            >
              Cheque ID: 898
            </Text>
            <Heading fontSize={"2xl"} fontFamily={"body"} fontWeight={500}>
              Nice Chair, pink
            </Heading>
            <Text fontSize={"sm"}>Cheque ID: 898</Text>
            <Text fontWeight={800} fontSize={"xl"}>
              $57
            </Text>
          </Stack>
          <Stack align={"flex-end"}>
            <Text
              color={"gray.500"}
              fontSize={"sm"}
              textTransform={"uppercase"}
            >
              Cheque ID: 898
            </Text>
            <Heading fontSize={"2xl"} fontFamily={"body"} fontWeight={500}>
              Nice Chair, pink
            </Heading>
            <Text fontSize={"sm"}>Cheque ID: 898</Text>
            <Text fontWeight={800} fontSize={"xl"}>
              $57
            </Text>
          </Stack>
        </Stack>
      </Box>
    </Center>
  );
}
