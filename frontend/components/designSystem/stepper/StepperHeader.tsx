import { ArrowBackIcon, SmallCloseIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";

interface Props {
  onClose?: () => void;
  back?: () => void;
  currentIndex: number;
  title?: string;
}

function StepperHeader({ onClose, back, currentIndex, title }: Props) {
  return (
    <Flex direction="row" width="100%" justify="space-between" pt={4}>
      {currentIndex != 0 ? (
        <IconButton
          aria-label="Back"
          icon={<ArrowBackIcon />}
          isDisabled={currentIndex == 0}
          onClick={back}
        />
      ) : (
        <Box h="40px" w="40px" />
      )}
      <Text fontWeight={600} fontSize={"xl"} textAlign="center" mb={4}>
        {title}
      </Text>
      {onClose ? (
        <IconButton
          aria-label="Next"
          icon={<SmallCloseIcon />}
          onClick={onClose}
        />
      ) : (
        <Box h="40px" w="40px" />
      )}
    </Flex>
  );
}

export default StepperHeader;
