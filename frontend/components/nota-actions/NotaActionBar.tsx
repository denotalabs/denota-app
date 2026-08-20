import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { ROLE_LABELS } from "../../utils/notaActions/rolePreview";
import { NotaRole, ResolvedAction } from "../../utils/notaActions/types";
import { notaInfoTheme as t } from "../designSystem/notaInfoTheme";

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
      <Text fontSize="13px" color={t.muted2}>
        No actions available as {ROLE_LABELS[previewRole].toLowerCase()} on
        this payment.
      </Text>
    );
  }

  const primary = actions.slice(0, 3);
  const overflow = actions.slice(3);

  const hint = !isWalletConnected
    ? "Connect a wallet to execute actions"
    : null;

  const previewButtonProps = isPreviewing
    ? { opacity: 0.85 as const, borderStyle: "dashed" as const }
    : {};

  return (
    <Flex gap={2.5} flexWrap="wrap" align="center">
      {primary.map((action) => {
        const Icon = action.icon;
        const emphasized = action.emphasis === "primary" && !isPreviewing;
        return (
          <Button
            key={action.id}
            leftIcon={<Icon size={16} />}
            onClick={() => onPick(action)}
            size="md"
            fontSize="sm"
            fontWeight={emphasized ? 500 : 400}
            borderRadius="10px"
            border="0.5px solid"
            borderColor={emphasized ? t.primary : t.line}
            bg={emphasized ? t.primary : t.buttonBg}
            color={emphasized ? t.pageBg : t.text}
            _hover={{
              bg: emphasized ? t.primaryLight : t.cardBg,
              borderColor: t.primary,
            }}
            _active={{ transform: "scale(0.98)" }}
            {...previewButtonProps}
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
            size="md"
            fontSize="sm"
            fontWeight={400}
            borderRadius="10px"
            border="0.5px solid"
            borderColor={t.line}
            bg={t.buttonBg}
            color={t.text}
            _hover={{ bg: t.cardBg, borderColor: t.primary }}
            {...previewButtonProps}
          >
            More
          </MenuButton>
          <MenuList bg={t.cardBg} borderColor={t.line}>
            {overflow.map((action) => {
              const Icon = action.icon;
              const destructive = action.risk === "destructive";
              return (
                <MenuItem
                  key={action.id}
                  icon={<Icon size={16} />}
                  onClick={() => onPick(action)}
                  bg="transparent"
                  color={destructive ? "red.400" : t.text}
                  _hover={{ bg: destructive ? "red.900" : t.buttonBg }}
                >
                  {action.label}
                </MenuItem>
              );
            })}
          </MenuList>
        </Menu>
      )}
      {hint && (
        <Text fontSize="xs" color={t.muted2}>
          {hint}
        </Text>
      )}
    </Flex>
  );
}

export default NotaActionBar;
