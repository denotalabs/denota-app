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
import { ROLE_LABELS } from "../../utils/notaActions/rolePreview";
import { NotaRole, ResolvedAction } from "../../utils/notaActions/types";

interface Props {
  actions: ResolvedAction[];
  onPick: (action: ResolvedAction) => void;
  isWalletConnected: boolean;
  isPreviewing: boolean;
  previewRole: NotaRole;
}

function NotaActionBar({
  actions,
  onPick,
  isWalletConnected,
  isPreviewing,
  previewRole,
}: Props) {
  if (actions.length === 0) {
    return (
      <Text fontSize="sm" color="gray.400" bg="brand.400" borderRadius="xl" px={4} py={3}>
        No actions available as {ROLE_LABELS[previewRole].toLowerCase()} on this
        nota.
      </Text>
    );
  }

  const primary = actions.slice(0, 3);
  const overflow = actions.slice(3);

  return (
    <VStackActions
      actions={primary}
      overflow={overflow}
      onPick={onPick}
      isPreviewing={isPreviewing}
      isWalletConnected={isWalletConnected}
    />
  );
}

function VStackActions({
  actions,
  overflow,
  onPick,
  isPreviewing,
  isWalletConnected,
}: {
  actions: ResolvedAction[];
  overflow: ResolvedAction[];
  onPick: (action: ResolvedAction) => void;
  isPreviewing: boolean;
  isWalletConnected: boolean;
}) {
  const actionButtonProps = isPreviewing
    ? {
        opacity: 0.85 as const,
        borderStyle: "dashed" as const,
      }
    : {};

  return (
    <>
      <HStack spacing={2.5} flexWrap="wrap">
        {actions.map((action) => {
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
              {...actionButtonProps}
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
              {...actionButtonProps}
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
      {!isWalletConnected && (
        <Text fontSize="xs" color="gray.500">
          Connect a wallet to execute actions.
        </Text>
      )}
      {isPreviewing && isWalletConnected && (
        <Text fontSize="xs" color="gray.500">
          Actions open in preview mode — switch back to your role to execute.
        </Text>
      )}
    </>
  );
}

export default NotaActionBar;
