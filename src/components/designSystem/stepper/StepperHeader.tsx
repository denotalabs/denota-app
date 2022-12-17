import { ArrowBackIcon, SmallCloseIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import { Text } from "@chakra-ui/react";

interface Props {
  onClose?: () => void;
  back?: () => void;
  currentIndex: number;
}

function StepperHeader({ onClose, back, currentIndex }: Props) {
  return (
    <Flex direction="row" width="100%" justify="space-between">
      <IconButton
        aria-label="Back"
        icon={<ArrowBackIcon />}
        disabled={currentIndex == 0}
        onClick={back}
      />
      <Text fontWeight={600} fontSize={"xl"} mb={4}>
        Step {currentIndex + 1}
      </Text>
      <IconButton
        aria-label="Next"
        icon={<SmallCloseIcon />}
        onClick={onClose}
      />
    </Flex>
  );
}

export default StepperHeader;