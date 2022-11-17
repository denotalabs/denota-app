import { Center, Flex, Text } from "@chakra-ui/react";

interface Props {
  title: string;
  value: string;
}

function ConfirmDetailsRow({ title, value }: Props) {
  return (
    <Flex w="100%" direction="row" justifyContent="space-between" py={4}>
      <Text fontWeight={600} fontSize="md" textAlign="center">
        {title}
      </Text>
      <Text fontWeight={200} fontSize="md" textAlign="center">
        {value}
      </Text>
    </Flex>
  );
}

export default ConfirmDetailsRow;
