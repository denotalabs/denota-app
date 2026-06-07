import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useMemo, useState } from "react";
import { IconType } from "react-icons";
import { MdCollections, MdEdit, MdGavel, MdSchedule, MdTouchApp } from "react-icons/md";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import {
  BALANCE_OF_CONDITIONAL_CASH_MODULE,
  defaultBalanceOfConditionalCashFormValues,
} from "../../../utils/balanceOfConditionalCash";
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
  onClick,
}: {
  title: string;
  description: string;
  icon: IconType;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      type="button"
      w="100%"
      textAlign="center"
      cursor="pointer"
      borderWidth="1px"
      borderColor="whiteAlpha.300"
      borderRadius="12px"
      bg="brand.700"
      px={4}
      py={6}
      transition="border-color 0.15s, background 0.15s"
      _hover={{
        borderColor: "whiteAlpha.500",
        bg: "brand.600",
      }}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "teal.400",
        outlineOffset: "2px",
      }}
      onClick={onClick}
    >
      <VStack spacing={3}>
        <Icon as={icon} boxSize={8} />
        <Heading size="md">{title}</Heading>
        <Text fontSize="sm" color="whiteAlpha.800">
          {description}
        </Text>
      </VStack>
    </Box>
  );
}

function ModuleSelectedHeader({
  title,
  description,
  icon,
  onChange,
}: {
  title: string;
  description: string;
  icon: IconType;
  onChange: () => void;
}) {
  return (
    <Flex align="flex-start" justify="space-between" gap={4} mb={6}>
      <HStack align="flex-start" spacing={4} flex={1} minW={0}>
        <Icon as={icon} boxSize={8} flexShrink={0} mt={1} />
        <VStack align="flex-start" spacing={1} minW={0}>
          <Heading size="md">{title}</Heading>
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
  const { next } = useStep();
  const { updateNotaFormValues, notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();
  const connectedAccount = blockchainState.account ?? "";
  const [showPicker, setShowPicker] = useState(true);

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

  const selectModule = (optionId: ModuleOptionId) => {
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
    showTerms && !showPicker && Boolean(notaFormValues.module);

  return (
    <Box w="100%" p={4}>
      {showPicker ? (
        <SimpleGrid
          spacing={4}
          templateColumns={{
            base: "repeat(1, 1fr)",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
        >
          {MODULE_OPTIONS.map((option) => (
            <ModuleOptionBox
              key={option.id}
              title={option.title}
              description={option.shortDescription}
              icon={option.icon}
              onClick={() => selectModule(option.id)}
            />
          ))}
        </SimpleGrid>
      ) : (
        showModuleTerms &&
        selectedOption && (
          <>
            <ModuleSelectedHeader
              title={selectedOption.title}
              description={selectedOption.description}
              icon={selectedOption.icon}
              onChange={() => setShowPicker(true)}
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
      )}
    </Box>
  );
};

export default ModuleSelectStep;
