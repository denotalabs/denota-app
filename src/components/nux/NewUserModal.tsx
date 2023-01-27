import { Center, VStack, Text, Button, Link } from "@chakra-ui/react";
import SimpleModal from "../designSystem/SimpleModal";
import Cookies from "js-cookie";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import WaveIcon from "./WaveIcon";


const notionOnboardingLink = "https://cheq-finance.notion.site/Cheq-Onboarding-8f3e101956f14e86b83feb06622988ad";
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function NewUserModal(props: Props) {
  return (
    <SimpleModal hideClose={true} {...props}>
      <NewUserModalContent onClose={props.onClose} />
    </SimpleModal>
  );
}

interface ContentProps {
  onClose: () => void;
}

function NewUserModalContent({ onClose }: ContentProps) {
  const { blockchainState } = useBlockchainData();

  return (
    <Center p={5}>
      <VStack>
        <WaveIcon />
        <Text fontWeight={600} fontSize={"2xl"} textAlign="center">
          Hey! Welcome to Cheq!
        </Text>
        <Text fontWeight={600} fontSize={"lg"} textAlign="center"></Text>
        <Link
          fontWeight={600}
          fontSize={"lg"}
          href={notionOnboardingLink}
          isExternal
          pb={3}
        >
          Looks like you're new here. Here's our docs
          <ExternalLinkIcon mx="2px" />
        </Link>
        <Button
          onClick={() => {
            Cookies.set(blockchainState.account, "1");
            onClose();
          }}
        >
          Got it!
        </Button>
      </VStack>
    </Center>
  );
}

export default NewUserModal;
