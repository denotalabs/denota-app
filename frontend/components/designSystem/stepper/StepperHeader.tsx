import { ArrowBackIcon, SmallCloseIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";

interface Props {
  onClose?: () => void;
  back?: () => void;
  currentIndex: number;
  title?: string;
  hideBack?: boolean;
}

function StepperHeader({ onClose, back, currentIndex, title, hideBack }: Props) {
  return (
    <Flex
      direction="row"
      width="100%"
      justify="space-between"
      align="center"
      pt={4}
      minH="40px"
    >
      {currentIndex != 0 && !hideBack ? (
        <IconButton
          aria-label="Back"
          size="sm"
          icon={<ArrowBackIcon />}
          isDisabled={currentIndex == 0}
          onClick={back}
          alignSelf="center"
        />
      ) : (
        <Box h="40px" w="40px" flexShrink={0} />
      )}
      <Text
        fontWeight={600}
        fontSize={"xl"}
        textAlign="center"
        mb={0}
        display={{ base: "none", md: "block" }}
      >
        {title}
      </Text>
      {onClose ? (
        <IconButton
          aria-label="Next"
          size="sm"
          icon={<SmallCloseIcon />}
          onClick={onClose}
          alignSelf="center"
        />
      ) : (
        <Box h="40px" w="40px" flexShrink={0} />
      )}
    </Flex>
  );
}

export default StepperHeader;
