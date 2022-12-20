import { RepeatIcon } from "@chakra-ui/icons";
import {
  Box,
  Center,
  Grid,
  HStack,
  IconButton,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { Cheq, useCheqs } from "../../hooks/useCheqs";
import RoundedButton from "../designSystem/RoundedButton";
// import { useTokens } from "../../hooks/useTokens";
import CheqCardV2 from "./CheqCardV2";
import SkeletonGrid from "./SkeletonGrid";

function MyCheqsView() {
  const [cheqField, setCheqField] = useState("all");
  const { cheqs, refresh } = useCheqs({ cheqField });

  return (
    <VStack
      boxShadow="outline"
      width="100%"
      p={6}
      borderRadius={"10px"}
      gap={6}
      align="stretch"
    >
      <HStack gap={2} justifyContent="space-between">
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
        <IconButton
          size="lg"
          aria-label="refresh"
          icon={<RepeatIcon />}
          onClick={refresh}
        />
      </HStack>

      <CheqGrid cheqs={cheqs} />
    </VStack>
  );
}

interface CheqGridProps {
  cheqs: Cheq[] | undefined;
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
    <Grid
      templateColumns={[
        "repeat(auto-fit, minmax(240px, 1fr))",
        "repeat(auto-fit, minmax(240px, 1fr))",
        "repeat(auto-fit, minmax(240px, 1fr))",
        "repeat(3, 1fr)",
      ]}
      gap={6}
    >
      {cheqs.map((cheq) => {
        return <CheqCardV2 key={cheq.id} cheq={cheq} />;
      })}
    </Grid>
  );
}

export default MyCheqsView;
