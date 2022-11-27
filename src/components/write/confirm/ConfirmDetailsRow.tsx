import { Center, Flex, Text } from "@chakra-ui/react";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  title: string;
  value: string;
}

function ConfirmDetailsRow({ title, value }: Props) {
  return (
    <RoundedBox py={4}>
      <Flex direction="row" justifyContent="space-between">
        <Text fontWeight={600} fontSize="md" textAlign="center">
          {title}
        </Text>
        <Text fontWeight={200} fontSize="md" textAlign="center">
          {value}
        </Text>
      </Flex>
    </RoundedBox>
  );
}

export default ConfirmDetailsRow;
