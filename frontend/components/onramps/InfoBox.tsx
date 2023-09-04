import { StyleProps, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";

interface Props extends StyleProps {
  children: ReactNode;
}

function InfoBox({ children, ...props }: Props) {
  return (
    <VStack
      w="550px"
      bg="brand.600"
      py={4}
      px={8}
      borderRadius="30px"
      {...props}
    >
      {children}
    </VStack>
  );
}

export default InfoBox;
