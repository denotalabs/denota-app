import { Text, VStack } from "@chakra-ui/react";
import DetailsRow from "../designSystem/DetailsRow";
import RoundedBox from "../designSystem/RoundedBox";
import RoundedButton from "../designSystem/RoundedButton";

interface Props {
  chain: string;
}
function DisperseDetails({ chain }: Props) {
  return (
    <VStack>
      <RoundedBox mb={5} padding={6}>
        <Text fontWeight={600} fontSize={"lg"} textAlign="center">
          You dispersing 5000 USDC and 1000 BOB on {chain}
        </Text>
      </RoundedBox>

      <RoundedBox p={6}>
        <VStack>
          <DetailsRow title="0x123..456" value="10 USDC" />
          <DetailsRow title="0x123..456" value="10 USDC" />
        </VStack>
      </RoundedBox>

      <RoundedButton mt={2} type="submit">
        {"Confirm"}
      </RoundedButton>
    </VStack>
  );
}

export default DisperseDetails;
