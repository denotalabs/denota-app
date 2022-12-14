import { Box, Center, Grid, Select, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useCheqs } from "../../hooks/useCheqs";
// import { useTokens } from "../../hooks/useTokens";
import CheqCardV2 from "./CheqCardV2";
import SkeletonGrid from "./SkeletonGrid";

function MyCheqsView() {
  const [cheqField, setCheqField] = useState("all");
  const { cheqs } = useCheqs({ cheqField });

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
        defaultValue={"all"}
        minW={0}
        w="120px"
        onChange={(event) => {
          setCheqField(event.target.value);
        }}
        focusBorderColor="clear"
      >
        <option value="all">All</option>
        <option value="cheqsReceived">Received</option>
        <option value="cheqsSent">Sent</option>
      </Select>
      <CheqGrid cheqs={cheqs} />
    </VStack>
  );
}

interface CheqGridProps {
  cheqs: any[] | undefined;
}

function CheqGrid({ cheqs }: CheqGridProps) {
  if (cheqs === undefined) {
    return <SkeletonGrid />;
  }

  if (cheqs.length === 0) {
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
