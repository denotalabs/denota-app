import { Box, Center, Grid, Select, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
// import { useTokens } from "../../hooks/useTokens";
import CheqCardV2 from "./CheqCardV2";
import SkeletonGrid from "./SkeletonGrid";

function MyCheqsView() {
  const [tokenField, setTokenField] = useState("tokensReceived");
  const tokens: any[] | undefined = [undefined];
  // TODO (Integrate v2 UI with v2 smart contract): Load cheqs from graph:
  // const tokens = useTokens(tokenField, true);

  return (
    <VStack
      boxShadow="outline"
      width="100%"
      p={6}
      borderRadius={"10px"}
      gap={6}
      align="stretch"
    >
      <Select
        defaultValue={"tokensReceived"}
        minW={0}
        w="120px"
        onChange={(event) => {
          setTokenField(event.target.value);
        }}
      >
        <option value="">All</option>
        <option value="tokensReceived">Received</option>
        <option value="tokensSent">Sent</option>
        <option value="tokensCashed">Cashed</option>
        <option value="tokensVoided">Voided</option>
      </Select>
      <CheqGrid tokens={tokens} />
    </VStack>
  );
}

interface CheqGridProps {
  tokens: any[] | undefined;
}

function CheqGrid({ tokens }: CheqGridProps) {
  if (tokens === undefined) {
    return <SkeletonGrid />;
  }

  if (tokens.length === 0) {
    return (
      <Center>
        <Text fontWeight={600} fontSize={"xl"} textAlign="center" pb={6}>
          {"No cheqs found"}
        </Text>
      </Center>
    );
  }

  return (
    <Grid templateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap={6}>
      <CheqCardV2
        sender="MakerDAO"
        status="cashable"
        token="USDC"
        amount="1000"
      />
      <CheqCardV2
        sender="MolochDAO"
        status="cashable"
        token="DAI"
        amount="1000"
      />
      <CheqCardV2
        sender="MolochDAO"
        status="cashable"
        token="DAI"
        amount="1000"
      />
      <CheqCardV2
        sender="USWeb3Guy.eth"
        status="pending"
        token="USDC"
        amount="500"
      />
      <CheqCardV2
        sender="0xDEADBEEF"
        status="cashed"
        token="DAI"
        amount="900"
      />
      <CheqCardV2 sender="0xFOOBAR" status="voided" token="USDC" amount="250" />
    </Grid>
  );
}

export default MyCheqsView;
