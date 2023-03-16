import { ArrowRightIcon, LockIcon, StarIcon } from "@chakra-ui/icons";
import { Center, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  isInvoice: boolean;
  module: string;
}

function ConfirmNotice({ isInvoice, module }: Props) {
  const iconForModule = useMemo(() => {
    switch (module) {
      case "direct":
        return <ArrowRightIcon />;
      case "escrow":
        return <LockIcon />;
      case "milestone":
        return <StarIcon />;
      default:
        return <StarIcon />;
    }
  }, [module]);

  const moduleTitle = useMemo(() => {
    switch (module) {
      case "direct":
        return "Direct Pay";
      case "escrow":
        return "Escrow";
      case "milestone":
        return "Milestones";
      default:
        return "";
    }
  }, [module]);

  const moduleDescription = useMemo(() => {
    switch (module) {
      case "direct":
        return "Funds will be released as soon as the payment is made";
      case "escrow":
        return "Funds will be held in escrow until released by the payer";
      case "milestone":
        return "Funds will be released on completion of milestones";
      default:
        return "";
    }
  }, [module]);
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
          {"A Cheq NFT is issued for tracking"}
        </Text>
      </Center>
    </RoundedBox>
  );
}

export default ConfirmNotice;
