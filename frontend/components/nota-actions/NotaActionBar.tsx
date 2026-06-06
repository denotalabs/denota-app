import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { ResolvedAction } from "../../utils/notaActions/types";

interface Props {
  actions: ResolvedAction[];
  onPick: (action: ResolvedAction) => void;
  isWalletConnected: boolean;
}

function NotaActionBar({ actions, onPick, isWalletConnected }: Props) {
  if (!isWalletConnected) {
    return (
      <Text fontSize="sm" color="gray.400" bg="brand.400" borderRadius="xl" px={4} py={3}>
        Connect a wallet to interact with this nota.
      </Text>
    );
  }

  if (actions.length === 0) {
    return (
      <Text fontSize="sm" color="gray.400" bg="brand.400" borderRadius="xl" px={4} py={3}>
        No actions available for your role on this nota.
      </Text>
    );
  }

  const primary = actions.filter((a) => a.risk !== "destructive").slice(0, 3);
  const overflow = actions.filter((a) => !primary.includes(a));

  return (
    <HStack spacing={2.5} flexWrap="wrap">
      {primary.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            leftIcon={<Icon size={16} />}
            onClick={() => onPick(action)}
            size="sm"
            bg="brand.400"
            borderWidth="1px"
            borderColor="brand.500"
            _hover={{ borderColor: "brand.200", bg: "brand.500" }}
          >
            {action.label}
          </Button>
        );
      })}
      {overflow.length > 0 && (
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            size="sm"
            bg="brand.400"
            borderWidth="1px"
            borderColor="brand.500"
            _hover={{ borderColor: "brand.200", bg: "brand.500" }}
          >
            More
          </MenuButton>
          <MenuList bg="brand.400" borderColor="brand.500">
            {overflow.map((action) => {
              const Icon = action.icon;
              const destructive = action.risk === "destructive";
              return (
                <MenuItem
                  key={action.id}
                  icon={<Icon size={16} />}
                  onClick={() => onPick(action)}
                  color={destructive ? "red.400" : undefined}
                  _hover={{ bg: destructive ? "red.900" : "brand.500" }}
                >
                  {action.label}
                </MenuItem>
              );
            })}
          </MenuList>
        </Menu>
      )}
    </HStack>
  );
}

export default NotaActionBar;
