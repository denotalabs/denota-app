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
import { Nota } from "@denota-labs/denota-sdk";
import { useRouter } from "next/router";
import { MdOutlineAdd } from "react-icons/md";
import { useNotaContext } from "../../context/NotasContext";
import NotaCard from "./NotaCard";

function MyNotas() {
  const { notas, refresh, setNotaField, isLoading } = useNotaContext();

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
            setNotaField(event.target.value);
          }}
          focusBorderColor="clear"
        >
          <option value="all">All</option>
          <option value="notasReceived">Received</option>
          <option value="notasSent">Sent</option>
        </Select>
        <IconButton
          size="lg"
          aria-label="refresh"
          icon={<RepeatIcon />}
          onClick={refresh}
        />
      </HStack>
      <MyNotasGrid notas={isLoading ? undefined : notas} />
    </VStack>
  );
}

interface GridProps {
  notas: Nota[] | undefined;
}

function MyNotasGrid({ notas }: GridProps) {
  const router = useRouter();

  if (notas === undefined) {
    return (
      <Center flexDirection={"column"} w="100%" px={5}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (notas.length === 0) {
    return (
      <Center>
        <Text fontWeight={600} fontSize={"xl"} textAlign="center" pb={6}>
          <Button
            bg="notaPurple.100"
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
      {notas.map((nota) => {
        return <NotaCard key={nota.id} nota={nota} />;
      })}
    </Grid>
  );
}

export default MyNotas;
