import { WarningTwoIcon } from "@chakra-ui/icons";
import { Box, Center, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function DesktopOnlyPage({ children }: Props) {
  return (
    <>
      <Box display={{ base: "none", md: "block" }}>{children}</Box>
      <Center
        display={{ base: "flex", md: "none" }}
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <WarningTwoIcon boxSize={12} my={3} />
        <Text textAlign="center" fontSize="xl">
          Denota is only supported on desktop
        </Text>
      </Center>
    </>
  );
}
