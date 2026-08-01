import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { IconType } from "react-icons";
import { MdCollections, MdEdit, MdGavel, MdSchedule, MdTouchApp } from "react-icons/md";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import {
  BALANCE_OF_CONDITIONAL_CASH_MODULE,
  defaultBalanceOfConditionalCashFormValues,
} from "../../../utils/balanceOfConditionalCash";
import {
  COMING_SOON_MODULES,
  ComingSoonModule,
  ComingSoonModuleId,
  getComingSoonModule,
} from "../../../utils/comingSoonModules";
import {
  CASH_BEFORE_DATE_DRIP_MODULE,
  defaultCashBeforeDateDripFormValues,
} from "../../../utils/dripPeriod";
import { CLAIMABLE_MODULE, isClaimableModule } from "../../../utils/expirationDate";
import {
  createValidatePaymentTerms,
  getAuditorFieldsForPaymentTerms,
  getPaymentTermsInitialValues,
  paymentTermsValuesToNotaForm,
} from "../../../utils/paymentTermsForm";
import { isPaymentTermsSubmitDisabled } from "../../../utils/paymentTermsSubmit";
import {
  isReversibleFormModule,
  RECOVERABLE_ALWAYS,
} from "../../../utils/reversibleModule";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import { ComingSoonTerms } from "../module/ComingSoonTerms";
import ModuleTerms from "../module/ModuleTerms";

interface Props extends ScreenProps {
  showTerms: boolean;
}

type ModuleOptionId = "claimable" | "reversible" | "drip" | "nftBalance";

interface ModuleOption {
  id: ModuleOptionId;
  title: string;
  shortDescription: string;
  description: string;
  icon: IconType;
  isSelected: (module: string) => boolean;
}

const MODULE_OPTIONS: ModuleOption[] = [
  {
    id: "claimable",
    title: "Claimable",
    shortDescription: "The owner must manually claim the funds",
    description: "The owner must manually claim the funds",
    icon: MdTouchApp,
    isSelected: isClaimableModule,
  },
  {
    id: "reversible",
    title: "Reversible",
    shortDescription: "Funds are releasable by the arbitrator",
    description:
      "Hold funds in escrow until you approve release. Ideal when goods or services may not arrive — an arbitrator can reverse payment if something goes wrong. Choose Before a date when delivery is expected by a deadline",
    icon: MdGavel,
    isSelected: isReversibleFormModule,
  },
  {
    id: "drip",
    title: "Drip",
    shortDescription:
      "Funds are claimable in chunks over time. Unclaimed chunks will be forfeited",
    description:
      "Funds are claimable in chunks over time. Unclaimed chunks will be forfeited",
    icon: MdSchedule,
    isSelected: (module) => module === CASH_BEFORE_DATE_DRIP_MODULE,
  },
  {
    id: "nftBalance",
    title: "NFT Balance Condition",
    shortDescription:
      "Unlock funds when the recipient holds the required NFT balance",
    description:
      "Release payment when the recipient holds the required NFT balance. After expiration, funds return to the sender",
    icon: MdCollections,
    isSelected: (module) => module === BALANCE_OF_CONDITIONAL_CASH_MODULE,
  },
];

function ModuleOptionBox({
  title,
  description,
  icon,
  comingSoon,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  icon: IconType;
  comingSoon?: boolean;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      type="button"
      w="100%"
      textAlign="left"
      cursor="pointer"
      borderWidth="1px"
      borderColor={
        selected
          ? "brand.200"
          : comingSoon
            ? "whiteAlpha.200"
            : "whiteAlpha.300"
      }
      boxShadow={
        selected ? "0 0 0 1px var(--chakra-colors-brand-200) inset" : undefined
      }
      borderRadius="16px"
      bg={selected ? "brand.300" : comingSoon ? "brand.800" : "brand.700"}
      px={4}
      py={4}
      opacity={comingSoon ? 0.92 : 1}
      transition="border-color 0.15s, background 0.15s"
      _hover={{
        borderColor: selected
          ? "brand.200"
          : comingSoon
            ? "whiteAlpha.400"
            : "whiteAlpha.500",
        bg: selected ? "brand.300" : comingSoon ? "brand.700" : "brand.600",
      }}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "teal.400",
        outlineOffset: "2px",
      }}
      onClick={onClick}
    >
      <HStack align="center" spacing={3.5}>
        <Flex
          w="38px"
          h="38px"
          borderRadius="10px"
          align="center"
          justify="center"
          flexShrink={0}
          bg={selected ? "brand.200" : "brand.600"}
          color={selected ? "brand.100" : undefined}
        >
          <Icon as={icon} boxSize={5} />
        </Flex>
        <HStack spacing={2} flexWrap="wrap" minW={0}>
          <Heading size="sm">{title}</Heading>
          {comingSoon ? (
            <Tag size="sm" colorScheme="purple">
              Coming Soon
            </Tag>
          ) : null}
        </HStack>
      </HStack>
      <Text mt={2.5} fontSize="13.5px" lineHeight={1.5} color="whiteAlpha.700">
        {description}
      </Text>
    </Box>
  );
}

function ModuleSelectedHeader({
  title,
  description,
  icon,
  comingSoon,
  onChange,
}: {
  title: string;
  description: string;
  icon: IconType;
  comingSoon?: boolean;
  onChange: () => void;
}) {
  return (
    <Flex align="flex-start" justify="space-between" gap={4} mb={6}>
      <HStack align="flex-start" spacing={4} flex={1} minW={0}>
        <Icon as={icon} boxSize={8} flexShrink={0} mt={1} />
        <VStack align="flex-start" spacing={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap">
            <Heading size="md">{title}</Heading>
            {comingSoon ? (
              <Tag size="sm" colorScheme="purple">
                Coming Soon
              </Tag>
            ) : null}
          </HStack>
          <Text fontSize="sm" color="whiteAlpha.800">
            {description}
          </Text>
        </VStack>
      </HStack>
      <Button
        flexShrink={0}
        variant="ghost"
        size="sm"
        leftIcon={<Icon as={MdEdit} boxSize={4} />}
        onClick={onChange}
      >
        Change
      </Button>
    </Flex>
  );
}

const ModuleSelectStep: React.FC<Props> = ({ showTerms }) => {
  const { next, setBackHidden } = useStep();
  const { updateNotaFormValues, notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();
  const connectedAccount = blockchainState.account ?? "";
  const [showPicker, setShowPicker] = useState(true);
  const [selectedComingSoonId, setSelectedComingSoonId] =
    useState<ComingSoonModuleId | null>(null);

  const auditorFields = useMemo(
    () => getAuditorFieldsForPaymentTerms(notaFormValues, connectedAccount),
    [connectedAccount, notaFormValues]
  );

  const initialValues = useMemo(
    () => getPaymentTermsInitialValues(notaFormValues, auditorFields),
    [notaFormValues, auditorFields]
  );

  const validate = useMemo(
    () => createValidatePaymentTerms(notaFormValues.module ?? ""),
    [notaFormValues.module]
  );

  const selectedOption = useMemo(
    () =>
      MODULE_OPTIONS.find((option) =>
        option.isSelected(notaFormValues.module ?? "")
      ),
    [notaFormValues.module]
  );

  const selectedComingSoonModule = useMemo(
    () =>
      selectedComingSoonId
        ? getComingSoonModule(selectedComingSoonId)
        : undefined,
    [selectedComingSoonId]
  );

  const selectComingSoonModule = (module: ComingSoonModule) => {
    setSelectedComingSoonId(module.id);
    setShowPicker(false);
  };

  const selectModule = (optionId: ModuleOptionId) => {
    setSelectedComingSoonId(null);
    switch (optionId) {
      case "claimable":
        updateNotaFormValues({
          module: CLAIMABLE_MODULE,
          expirationDate: "",
        });
        break;
      case "reversible":
        updateNotaFormValues({
          module: "reversibleRelease",
          recoverableWhen: RECOVERABLE_ALWAYS,
          inspectionEndDate: "",
          auditor: connectedAccount,
          resolvedAuditor: "",
        });
        break;
      case "drip":
        updateNotaFormValues({
          module: CASH_BEFORE_DATE_DRIP_MODULE,
          ...defaultCashBeforeDateDripFormValues(),
        });
        break;
      case "nftBalance":
        updateNotaFormValues({
          module: BALANCE_OF_CONDITIONAL_CASH_MODULE,
          ...defaultBalanceOfConditionalCashFormValues(),
        });
        break;
    }

    if (!showTerms) {
      next?.();
      return;
    }

    setShowPicker(false);
  };

  const showModuleTerms =
    showTerms &&
    !showPicker &&
    (Boolean(notaFormValues.module) || Boolean(selectedComingSoonModule));

  useEffect(() => {
    setBackHidden?.(showModuleTerms);
    return () => setBackHidden?.(false);
  }, [setBackHidden, showModuleTerms]);

  const resetPicker = () => {
    setSelectedComingSoonId(null);
    setShowPicker(true);
  };

  return (
    <Box w="100%" px={{ base: 4, md: 1 }} py={4}>
      {showPicker ? (
        <VStack spacing={3} align="stretch">
          {MODULE_OPTIONS.map((option) => (
            <ModuleOptionBox
              key={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              selected={
                !selectedComingSoonId &&
                option.isSelected(notaFormValues.module ?? "")
              }
              onClick={() => selectModule(option.id)}
            />
          ))}
          {COMING_SOON_MODULES.filter((module) =>
            getComingSoonModule(module.id)
          ).map((module) => (
            <ModuleOptionBox
              key={module.id}
              title={module.title}
              description={module.description}
              icon={module.icon}
              comingSoon
              selected={selectedComingSoonId === module.id}
              onClick={() => selectComingSoonModule(module)}
            />
          ))}
        </VStack>
      ) : (
        showModuleTerms &&
        (selectedComingSoonModule ? (
          <>
            <ModuleSelectedHeader
              title={selectedComingSoonModule.title}
              description={selectedComingSoonModule.description}
              icon={selectedComingSoonModule.icon}
              comingSoon
              onChange={resetPicker}
            />
            <ComingSoonTerms module={selectedComingSoonModule} />
            <RoundedButton isDisabled type="button">
              Coming Soon
            </RoundedButton>
          </>
        ) : (
          selectedOption && (
            <>
              <ModuleSelectedHeader
                title={selectedOption.title}
                description={selectedOption.description}
                icon={selectedOption.icon}
                onChange={resetPicker}
              />
              <Formik
                key={notaFormValues.module}
                enableReinitialize
                initialValues={initialValues}
                validate={validate}
                onSubmit={(values) => {
                  updateNotaFormValues(paymentTermsValuesToNotaForm(values));
                  next?.();
                }}
              >
                {(props) => (
                  <Form>
                    <ModuleTerms module={notaFormValues.module} />
                    <RoundedButton
                      isDisabled={isPaymentTermsSubmitDisabled(props)}
                      type="submit"
                    >
                      {"Next"}
                    </RoundedButton>
                  </Form>
                )}
              </Formik>
            </>
          )
        ))
      )}
    </Box>
  );
};

export default ModuleSelectStep;
