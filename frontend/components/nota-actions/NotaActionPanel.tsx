import { ArrowForwardIcon, WarningIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { useCallback, useState } from "react";
import { useEnsAddress } from "../../hooks/useEnsAddress";
import { useFundReadiness } from "../../hooks/useFundReadiness";
import { isEnsName } from "../../utils/ensAddress";
import {
  ActionFormValues,
  NotaActionContext,
  ResolvedAction,
} from "../../utils/notaActions/types";
import AddressDisplay from "../designSystem/AddressDisplay";
import InfoTooltip from "../designSystem/InfoTooltip";
import RoundedButton from "../designSystem/RoundedButton";
import SlideOver from "../designSystem/SlideOver";

interface Props {
  action: ResolvedAction | null;
  context: NotaActionContext;
  canExecute: boolean;
  isPreviewing: boolean;
  onClose: () => void;
  onSubmit: (actionId: string, values: ActionFormValues) => Promise<void>;
}

function ActionField({
  label,
  value,
  onChange,
  type,
  placeholder,
  tooltipLabel,
  symbol,
  maxEscrow,
  onMax,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: "address" | "amount" | "text";
  placeholder?: string;
  tooltipLabel?: string;
  symbol?: string;
  maxEscrow?: string | null;
  onMax?: () => void;
}) {
  return (
    <FormControl>
      <FormLabel fontSize="sm" color="gray.400">
        {label}
        {tooltipLabel ? <InfoTooltip label={tooltipLabel} /> : null}
      </FormLabel>
      <Box position="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          bg="brand.400"
          borderColor="brand.500"
          _focus={{ borderColor: "brand.200" }}
          inputMode={type === "amount" ? "decimal" : "text"}
        />
        {type === "amount" && symbol && (
          <Text
            position="absolute"
            right={3}
            top="50%"
            transform="translateY(-50%)"
            fontSize="sm"
            color="gray.500"
            pointerEvents="none"
          >
            {symbol}
          </Text>
        )}
      </Box>
      {maxEscrow != null && onMax && (
        <Button
          variant="link"
          size="xs"
          color="brand.200"
          mt={1}
          onClick={onMax}
        >
          Max {maxEscrow} {symbol}
        </Button>
      )}
    </FormControl>
  );
}

function NotaActionPanel({
  action,
  context,
  canExecute,
  isPreviewing,
  onClose,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<ActionFormValues>({});
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = useCallback(
    (key: keyof ActionFormValues, value: string) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toValue = values.to ?? "";
  const { address: resolvedTo, isLoading: ensLoading } = useEnsAddress(toValue);

  const fundReadiness = useFundReadiness({
    tokenAddress: context.currency,
    escrow: values.escrow ?? "",
    instant: values.instant ?? "",
    enabled: action?.id === "fund",
  });

  if (!action) {
    return null;
  }

  const Icon = action.icon;
  const warning = action.risk === "warning";
  const destructive = action.risk === "destructive";
  const needsConfirm = action.confirm && !confirmed;

  const handleSubmit = async (submitValues: ActionFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(action.id, submitValues);
      onClose();
      setValues({});
      setConfirmed(false);
    } catch {
      // errors handled by action hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFundSubmit = async () => {
    if (fundReadiness.insufficientBalance) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (fundReadiness.needsApproval) {
        await fundReadiness.approveAmount();
      } else {
        await onSubmit(action.id, {
          escrow: values.escrow ?? "0",
          instant: values.instant ?? "0",
        });
        onClose();
        setValues({});
      }
    } catch {
      // errors handled by hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  const fundButtonText = () => {
    if (fundReadiness.insufficientBalance) {
      return "Insufficient funds";
    }
    if (fundReadiness.needsApproval) {
      return `Approve ${context.currencySymbol}`;
    }
    return action.label;
  };

  const transferValid =
    toValue &&
    (ethers.utils.isAddress(toValue) ||
      (isEnsName(toValue) && resolvedTo && !ensLoading));

  const previewBlocked = isPreviewing || !canExecute;

  const footer =
    !action.branch &&
    (previewBlocked ? (
      <RoundedButton mt={0} isDisabled>
        {isPreviewing
          ? "Preview only — switch to your role to execute"
          : "Connect a wallet to execute"}
      </RoundedButton>
    ) : action.id === "fund" ? (
      <RoundedButton
        mt={0}
        isDisabled={
          fundReadiness.insufficientBalance ||
          fundReadiness.totalAmount <= 0 ||
          fundReadiness.isChecking
        }
        isLoading={isSubmitting || fundReadiness.isChecking}
        onClick={handleFundSubmit}
      >
        {fundButtonText()}
      </RoundedButton>
    ) : (
      <RoundedButton
        mt={0}
        isDisabled={
          needsConfirm ||
          (action.id === "transfer" && !transferValid) ||
          isSubmitting
        }
        isLoading={isSubmitting}
        bg={destructive ? "red.500" : undefined}
        _hover={destructive ? { bg: "red.600" } : undefined}
        onClick={() =>
          handleSubmit({
            ...values,
            ...(action.id === "transfer" && resolvedTo
              ? { to: toValue }
              : {}),
          })
        }
      >
        {action.label}
      </RoundedButton>
    ));

  return (
    <SlideOver
      isOpen
      onClose={onClose}
      title={action.label}
      subtitle={`Payment #${context.id}`}
      icon={<Icon size={19} />}
      iconBg={destructive ? "red.900" : "brand.400"}
      footer={footer}
    >
      <VStack align="stretch" spacing={5}>
        {isPreviewing && (
          <Text
            fontSize="sm"
            color="orange.600"
            bg="orange.900"
            borderWidth="1px"
            borderColor="orange.700"
            borderRadius="lg"
            px={3.5}
            py={3}
          >
            Preview mode — forms are read-only until you switch back to your
            connected role.
          </Text>
        )}
        {action.note && (
          <HStack
            align="flex-start"
            spacing={2}
            fontSize="sm"
            color={warning ? "yellow.200" : "gray.400"}
            bg={warning ? "yellow.900" : "brand.400"}
            borderWidth="1px"
            borderColor={warning ? "yellow.700" : "brand.500"}
            borderRadius="lg"
            px={3.5}
            py={3}
          >
            {warning && <WarningIcon color="yellow.400" boxSize={4} mt={0.5} flexShrink={0} />}
            <Text>{action.note}</Text>
          </HStack>
        )}

        {action.branch && action.branches ? (
          <VStack spacing={3} align="stretch">
            {action.branches.map((branch) => {
              const destination = branch.to(context);
              const shortDest = destination
                ? `${destination.slice(0, 10)}…${destination.slice(-6)}`
                : "—";
              return (
                <Button
                  key={branch.key}
                  isDisabled={
                    previewBlocked ||
                    !destination ||
                    !ethers.utils.isAddress(destination)
                  }
                  onClick={() =>
                    handleSubmit({
                      escrow: context.escrow,
                      to: destination,
                      branch: branch.key,
                    })
                  }
                  isLoading={isSubmitting}
                  h="auto"
                  py={3.5}
                  px={4}
                  justifyContent="space-between"
                  bg={branch.tone === "go" ? "green.900" : "orange.900"}
                  borderWidth="1px"
                  borderColor={branch.tone === "go" ? "green.700" : "orange.700"}
                  _hover={{
                    borderColor:
                      branch.tone === "go" ? "green.500" : "orange.500",
                  }}
                  color={branch.tone === "go" ? "green.600" : "orange.600"}
                >
                  <Box textAlign="left">
                    <Text fontWeight="medium">{branch.label}</Text>
                    <Text fontSize="xs" opacity={0.7} fontFamily="mono">
                      {shortDest}
                    </Text>
                  </Box>
                  <Box textAlign="right">
                    <Text fontWeight="semibold">{context.escrow}</Text>
                    <Text fontSize="xs" opacity={0.7}>
                      {context.currencySymbol}
                    </Text>
                  </Box>
                </Button>
              );
            })}
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
            {action.fields.map((field) => (
              <ActionField
                key={field.name}
                label={field.label}
                value={(values[field.name as keyof ActionFormValues] as string) ?? ""}
                onChange={(v) => set(field.name as keyof ActionFormValues, v)}
                type={field.type}
                placeholder={field.placeholder}
                tooltipLabel={field.tooltipLabel}
                symbol={
                  field.type === "amount" ? context.currencySymbol : undefined
                }
                maxEscrow={
                  field.name === "escrow" && action.id === "cash"
                    ? context.escrow
                    : null
                }
                onMax={
                  field.name === "escrow" && action.id === "cash"
                    ? () => set("escrow", context.escrow)
                    : undefined
                }
              />
            ))}
            {action.id === "transfer" && toValue && isEnsName(toValue) && (
              <Text fontSize="xs" color="gray.400">
                {ensLoading
                  ? "Resolving ENS…"
                  : resolvedTo
                    ? (
                      <>
                        Resolves to{" "}
                        <AddressDisplay address={resolvedTo} shorten />
                      </>
                    )
                    : "ENS name could not be resolved"}
              </Text>
            )}
          </VStack>
        )}

        {action.erc20 &&
          fundReadiness.totalAmount > 0 &&
          !fundReadiness.insufficientBalance && (
            <HStack
              fontSize="sm"
              color="gray.400"
              bg="brand.400"
              borderWidth="1px"
              borderColor="brand.500"
              borderRadius="lg"
              px={3.5}
              py={3}
              spacing={3}
            >
              <Flex align="center" gap={1.5}>
                <Box
                  bg="brand.500"
                  color="brand.200"
                  borderRadius="full"
                  w={5}
                  h={5}
                  display="grid"
                  placeItems="center"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  1
                </Box>
                Approve {context.currencySymbol}
              </Flex>
              <ArrowForwardIcon color="gray.600" />
              <Flex align="center" gap={1.5}>
                <Box
                  bg={
                    fundReadiness.needsApproval ? "brand.500" : "green.700"
                  }
                  color="brand.200"
                  borderRadius="full"
                  w={5}
                  h={5}
                  display="grid"
                  placeItems="center"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  2
                </Box>
                Fund
              </Flex>
            </HStack>
          )}

        {destructive && (
          <Checkbox
            isChecked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            colorScheme="red"
          >
            <HStack spacing={1.5}>
              <WarningIcon color="red.400" boxSize={3.5} />
              <Text fontSize="sm">
                I understand this permanently destroys payment #{context.id}.
              </Text>
            </HStack>
          </Checkbox>
        )}
      </VStack>
    </SlideOver>
  );
}

export default NotaActionPanel;
