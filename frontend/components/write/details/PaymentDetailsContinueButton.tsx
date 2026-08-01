import { Button, type ButtonProps } from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { formTheme } from "../../designSystem/form/formTheme";

interface Props extends ButtonProps {
  children: ReactNode;
}

export function PaymentDetailsContinueButton({
  children,
  isDisabled,
  ...props
}: Props) {
  return (
    <Button
      type="submit"
      w="100%"
      minH="56px"
      border="none"
      borderRadius="16px"
      bg="brand.200"
      color="brand.100"
      fontSize="17px"
      fontWeight={700}
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={2}
      boxShadow={formTheme.ctaShadow}
      opacity={isDisabled ? 0.4 : 1}
      cursor={isDisabled ? "not-allowed" : "pointer"}
      _hover={{ bg: "brand.200" }}
      _active={{ bg: "brand.200" }}
      isDisabled={isDisabled}
      {...props}
    >
      {children}
      <ArrowRight size={19} strokeWidth={2.5} />
    </Button>
  );
}
