import { Button } from "@chakra-ui/react";
import { ReactNode } from "react";

interface Props {
  onClick: () => void;
  children: ReactNode;
}

function RoundedButton({ onClick, children }: Props) {
  return (
    <Button mt={4} w="100%" borderRadius={"10px"} onClick={onClick}>
      {children}
    </Button>
  );
}

export default RoundedButton;
