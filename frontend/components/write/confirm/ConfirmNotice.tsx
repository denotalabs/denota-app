import { ArrowRightIcon, LockIcon, StarIcon } from "@chakra-ui/icons";
import { Center, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { CASH_BEFORE_DATE_DRIP_MODULE } from "../../../utils/dripPeriod";
import {
  isClaimableModule,
  resolveClaimableHook,
} from "../../../utils/expirationDate";
import {
  isReversibleFormModule,
  resolveReversibleHook,
} from "../../../utils/reversibleModule";
import RoundedBox from "../../designSystem/RoundedBox";

function ConfirmNotice() {
  const { notaFormValues } = useNotaForm();
  const module = notaFormValues.module ?? "";

  const displayModule = useMemo(() => {
    if (isClaimableModule(module)) {
      return resolveClaimableHook(notaFormValues.expirationDate);
    }
    if (isReversibleFormModule(module)) {
      return resolveReversibleHook(
        notaFormValues.recoverableWhen,
        notaFormValues.inspectionEndDate
      );
    }
    return module;
  }, [
    module,
    notaFormValues.expirationDate,
    notaFormValues.recoverableWhen,
    notaFormValues.inspectionEndDate,
  ]);

  const iconForModule = useMemo(() => {
    switch (displayModule) {
      case "directSend":
        return <ArrowRightIcon />;
      case "cashBeforeDate":
      case "reversibleRelease":
      case "reversibleByBeforeDate":
      case "simpleCash":
        return <LockIcon />;
      case "milestone":
      case "cashBeforeDateDrip":
        return <StarIcon />;
      default:
        return <StarIcon />;
    }
  }, [displayModule]);

  const moduleTitle = useMemo(() => {
    if (isClaimableModule(module)) {
      return "Claimable";
    }
    if (isReversibleFormModule(module)) {
      return "Reversible";
    }
    if (module === CASH_BEFORE_DATE_DRIP_MODULE) {
      return "Drip";
    }
    switch (displayModule) {
      case "directSend":
        return "Direct Pay";
      case "reversibleRelease":
        return "Reversible Release";
      case "simpleCash":
        return "Simple Cash";
      case "milestone":
        return "Milestones";
      default:
        return "";
    }
  }, [displayModule, module]);

  const moduleDescription = useMemo(() => {
    if (isClaimableModule(module)) {
      return displayModule === "cashBeforeDate"
        ? "The owner must manually claim the tokens before the deadline"
        : "The owner must manually claim the tokens";
    }
    if (isReversibleFormModule(module)) {
      return displayModule === "reversibleByBeforeDate"
        ? "Funds are held in escrow; recovery is only allowed before the inspection end"
        : "Funds are held in escrow until released by the reversible party";
    }
    if (module === CASH_BEFORE_DATE_DRIP_MODULE) {
      return "The owner can claim drip amounts on a schedule until the expiration date";
    }
    switch (displayModule) {
      case "directSend":
        return "Funds will be released as soon as the payment is made";
      case "milestone":
        return "Funds will be released on completion of milestones";
      case "simpleCash":
        return "Funds are locked until cashed by the recipient";
      default:
        return "";
    }
  }, [displayModule, module]);

  return (
    <RoundedBox mb={5} padding={6}>
      <Center flexDirection="column">
        {iconForModule}
        <Text fontWeight={600} fontSize={"2xl"} textAlign="center">
          {moduleTitle}
        </Text>
        <Text fontWeight={600} fontSize={"lg"} textAlign="center">
          {moduleDescription}
        </Text>
        <Text fontWeight={600} fontSize={"md"} textAlign="center">
          {"A nota NFT is issued for tracking"}
        </Text>
      </Center>
    </RoundedBox>
  );
}

export default ConfirmNotice;
