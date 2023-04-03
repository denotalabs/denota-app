import { RepeatIcon } from "@chakra-ui/icons";
import {
  Button,
  Center,
  Grid,
  HStack,
  IconButton,
  Select,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { MdOutlineAdd } from "react-icons/md";
import { useCheqContext } from "../../context/CheqsContext";
import { Cheq } from "../../hooks/useCheqs";
import CheqCardV2 from "./CheqCardV2";

function MyCheqsView() {
  const { cheqs, refresh, setCheqField, isLoading } = useCheqContext();

  return (
    <VStack
      width="95%" // Changed for demo
      p={6}
      borderRadius="30px"
      gap={6}
      align="stretch"
      bg="brand.100"
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

      <CheqGrid cheqs={isLoading ? undefined : cheqs} />
    </VStack>
  );
}

interface CheqGridProps {
  cheqs: Cheq[] | undefined;
}

function CheqGrid({ cheqs }: CheqGridProps) {
  const router = useRouter();

  if (cheqs === undefined) {
    return (
      <Center flexDirection={"column"} w="100%" px={5}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (cheqs.length === 0) {
    return (
      <Center>
        <Text fontWeight={600} fontSize={"xl"} textAlign="center" pb={6}>
          <Button
            bg="cheqPurple.100"
            w="min(40vw, 200px)"
            onClick={() => {
              router.push("/send", undefined, { shallow: true });
            }}
            fontSize="2xl"
            size="lg"
            borderRadius={5}
            leftIcon={<MdOutlineAdd />}
          >
            New Nota
          </Button>{" "}
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
      bg={["transparent", "transparent", "brand.600"]}
      borderRadius="10px"
      p={{ md: "0", lg: "4" }}
    >
      {cheqs.map((cheq) => {
        return <CheqCardV2 key={cheq.id} cheq={cheq} />;
      })}
    </Grid>
  );
}

export default MyCheqsView;
