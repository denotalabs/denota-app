import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Button, Center, Link, Text, VStack } from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import SimpleModal from "../designSystem/SimpleModal";
import WaveIcon from "./WaveIcon";

export const notionOnboardingLink =
  "https://denota.notion.site/What-is-Denota-Protocol-9c18517ed13b4644bc8c796d7427aa80";
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function NewUserModal(props: Props) {
  return (
    <SimpleModal hideClose={true} closeOnOverlayClick={false} {...props}>
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
          Hola! Welcome to Denota!
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
