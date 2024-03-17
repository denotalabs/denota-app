import { ArrowRightIcon, LockIcon, StarIcon } from "@chakra-ui/icons";
import { Center, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  module: string;
}

function ConfirmNotice({ module }: Props) {
  const iconForModule = useMemo(() => {
    switch (module) {
      case "directSend":
        return <ArrowRightIcon />;
      case "reversibleRelease":
        return <LockIcon />;
      case "milestone":
        return <StarIcon />;
      case "simpleCash":
        return <LockIcon />;
      default:
        return <StarIcon />;
    }
  }, [module]);

  const moduleTitle = useMemo(() => {
    switch (module) {
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
  }, [module]);

  const moduleDescription = useMemo(() => {
    switch (module) {
      case "directSend":
        return "Funds will be released as soon as the payment is made";
      case "reversibleRelease":
        return "Funds will be held in escrow until released by the payer";
      case "milestone":
        return "Funds will be released on completion of milestones";
      case "simpleCash":
        return "Funds are locked until cashed by the recipient";
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
          {"A nota NFT is issued for tracking"}
        </Text>
      </Center>
    </RoundedBox>
  );
}

export default ConfirmNotice;
