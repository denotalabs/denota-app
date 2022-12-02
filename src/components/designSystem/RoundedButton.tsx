import { Button } from "@chakra-ui/react";
import { ReactNode } from "react";

interface Props {
  onClick?: () => void;
  type?: "button" | "submit";
  children: ReactNode;
  isLoading?: boolean;
}

function RoundedButton({ onClick, children, type, isLoading }: Props) {
  return (
    <Button
      mt={4}
      w="100%"
      borderRadius={"10px"}
      onClick={onClick}
      type={type}
      isLoading={isLoading}
    >
      {children}
    </Button>
  );
}

export default RoundedButton;
