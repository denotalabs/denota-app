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
  const showBack = currentIndex != 0 && !hideBack;
  const showChrome = showBack || Boolean(onClose);

  if (!showChrome) {
    return (
      <Flex
        width="100%"
        justify="center"
        align="center"
        pt={1}
        display={{ base: "none", md: "flex" }}
      >
        <Text fontWeight={600} fontSize="lg" textAlign="center" mb={0}>
          {title}
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      direction="row"
      width="100%"
      justify="space-between"
      align="center"
      pt={hideBack ? 1 : { base: 4, md: 3 }}
      minH="40px"
    >
      {showBack ? (
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
        fontSize="lg"
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
