import { ViewIcon } from "@chakra-ui/icons";
import { Flex, HStack, Select, Text } from "@chakra-ui/react";
import { notaInfoTheme as t } from "../designSystem/notaInfoTheme";
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
  onPreviewRoleChange: (role: NotaRole) => void;
}

const ROLE_NOTES: Record<NotaRole, string> = {
  owner: "You receive funds if released",
  approved: "You can act on the owner's behalf",
  inspector: "You decide the outcome",
  payer: "You funded this escrow",
  stranger: "No role on this payment",
};

function NotaRolePreview({
  context,
  previewRole,
  walletRole,
  isWalletConnected,
  onPreviewRoleChange,
}: Props) {
  const roles = previewableRoles(context);
  const isPreviewing = previewRole !== walletRole;

  return (
    <Flex
      align="center"
      gap={2.5}
      fontSize="13px"
      color={t.muted}
      flexWrap="wrap"
      pb={3.5}
      mb={3.5}
      borderBottom="0.5px solid"
      borderColor={t.line}
    >
      <HStack spacing={2} flexShrink={0}>
        <ViewIcon color={t.primaryLight} boxSize={4} />
        <Text as="span">Viewing as</Text>
      </HStack>
      <Select
        value={previewRole}
        onChange={(e) => onPreviewRoleChange(e.target.value as NotaRole)}
        size="sm"
        width="auto"
        minW="118px"
        bg={t.pageBg}
        color={t.text}
        borderColor={t.line}
        borderRadius="8px"
        _hover={{ borderColor: t.primary }}
        _focus={{ borderColor: t.primary }}
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
            {isWalletConnected && role === walletRole ? " (you)" : ""}
          </option>
        ))}
      </Select>
      <Text ml="auto" fontSize="xs" color={isPreviewing ? "orange.300" : t.muted2}>
        {isPreviewing
          ? `Preview only — connect as ${ROLE_LABELS[
              previewRole
            ].toLowerCase()} to execute`
          : ROLE_NOTES[previewRole]}
      </Text>
    </Flex>
  );
}

export default NotaRolePreview;
