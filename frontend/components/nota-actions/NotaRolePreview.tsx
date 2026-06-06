import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  Text,
} from "@chakra-ui/react";
import {
  previewableRoles,
  ROLE_LABELS,
} from "../../utils/notaActions/rolePreview";
import { NotaActionContext, NotaRole } from "../../utils/notaActions/types";

interface Props {
  context: NotaActionContext;
  previewRole: NotaRole;
  walletRole: NotaRole;
  isWalletConnected: boolean;
  hookName: string | null;
  onPreviewRoleChange: (role: NotaRole) => void;
  onResetToWalletRole: () => void;
}

function NotaRolePreview({
  context,
  previewRole,
  walletRole,
  isWalletConnected,
  hookName,
  onPreviewRoleChange,
  onResetToWalletRole,
}: Props) {
  const roles = previewableRoles(context);
  const isPreviewing = previewRole !== walletRole;

  return (
    <HStack spacing={2} flexWrap="wrap" align="center">
      <Menu>
        <MenuButton
          as={Button}
          size="sm"
          rightIcon={<ChevronDownIcon />}
          bg="brand.400"
          borderWidth="1px"
          borderColor="brand.500"
          _hover={{ borderColor: "brand.200", bg: "brand.500" }}
          fontWeight="normal"
        >
          <Text as="span" color="gray.400" mr={1}>
            View as
          </Text>
          {ROLE_LABELS[previewRole]}
        </MenuButton>
        <MenuList bg="brand.400" borderColor="brand.500" minW="12rem">
          {roles.map((role) => {
            const isYou = isWalletConnected && role === walletRole;
            return (
              <MenuItem
                key={role}
                onClick={() => onPreviewRoleChange(role)}
                bg={role === previewRole ? "brand.500" : undefined}
                _hover={{ bg: "brand.500" }}
              >
                {ROLE_LABELS[role]}
                {isYou ? " (you)" : ""}
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>

      {isPreviewing ? (
        <>
          <Tag size="sm" colorScheme="orange">
            Preview only — connect as {ROLE_LABELS[previewRole].toLowerCase()}{" "}
            to execute
          </Tag>
        </>
      ) : (
        isWalletConnected && (
          <Tag size="sm" colorScheme="blue">
            Your role: {ROLE_LABELS[walletRole]}
          </Tag>
        )
      )}
    </HStack>
  );
}

export default NotaRolePreview;
