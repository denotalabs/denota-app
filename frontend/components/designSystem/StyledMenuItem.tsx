import { MenuItem, MenuItemProps } from "@chakra-ui/react";

export default function StyledMenuItem({ children, ...rest }: MenuItemProps) {
  return (
    <MenuItem
      bg="brand.100"
      _hover={{ bg: "brand.300" }}
      fontSize="lg"
      {...rest}
    >
      {children}
    </MenuItem>
  );
}
