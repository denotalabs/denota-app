import { Button, ButtonProps, StyleProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface Props extends StyleProps, ButtonProps {
  onClick?: () => void;
  type?: "button" | "submit";
  children: ReactNode;
  isLoading?: boolean;
}

function RoundedButton({
  onClick,
  children,
  type,
  isLoading,
  ...props
}: Props) {
  return (
    <Button
      bg="brand.200"
      color="brand.100"
      mt={4}
      w="100%"
      minH="48px"
      borderRadius={"10px"}
      onClick={onClick}
      type={type}
      isLoading={isLoading}
      _hover={{ bg: "black" }}
      {...props}
    >
      {children}
    </Button>
  );
}

export default RoundedButton;
