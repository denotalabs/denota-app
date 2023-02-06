import { ReactNode } from "react";

import { Box, StyleProps } from "@chakra-ui/react";

interface Props extends StyleProps {
  children: ReactNode;
}

function RoundedBox({ children, ...props }: Props) {
  return (
    <Box borderRadius={10} bg="brand.600" w="100%" {...props}>
      {children}
    </Box>
  );
}

export default RoundedBox;
