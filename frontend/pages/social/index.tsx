import { SearchIcon } from "@chakra-ui/icons";
import {
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
} from "@chakra-ui/react";
import { ChangeEvent, useMemo, useState } from "react";
import SearchResult from "../../components/social/SearchResult";

const fakeResult1 = {
  title: "0xrafi.eth",
  items: [
    {
      title: "1/5/2023 | MakerDAO.eth → 0xrafi.eth",
      description: "Invoice | 12 wETH | ONGOING",
      subItems: [
        { title: "10/01/2022", description: "Invoice created" },
        { title: "10/25/2022", description: "Milestone #1 paid" },
        { title: "11/18/2022", description: "Milestone #2 paid" },
        { title: "1/5/2023", description: "Milestone #3 paid" },
      ],
    },
    {
      title: "12/9/2019 | Bankless.eth → vitalik.eth",
      description: "0.2 wETH | PAID",
    },
  ],
};

const fakeResult2 = {
  title: "0xrafi1.eth",
  items: [
    {
      title: "12/6/2022 | vitalik.eth → 0xrafi1.eth",
      description: "Invoice | 0.1 rBTC | PAID",
    },
  ],
};

const fakeResults = [fakeResult1, fakeResult2];

const nullResult1 = {
  title: "almaraz.eth",
  items: [
    {
      title: "3/6/2023 | 0xrafi.eth → almaraz.eth",
      description: "Invoice | 0.11 rBTC | PAID",
    },
  ],
};

const nullResult2 = {
  title: "0xrafi.eth",
  items: [
    {
      title: "2/6/2023 | pengu.eth → 0xrafi.eth",
      description: "Invoice | 0.42 rBTC | PAID",
    },
  ],
};

const nullResults = [nullResult1, nullResult2];

function SocialPage() {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const resultsFound = useMemo(() => {
    return searchValue.includes("ra");
  }, [searchValue]);

  const result = useMemo(() => {
    if (resultsFound) {
      return (
        <>
          {fakeResults.map((item, index) => {
            return <SearchResult key={index} {...item} />;
          })}
        </>
      );
    }
    return (
      <>
        {nullResults.map((item, index) => {
          return <SearchResult key={index} {...item} />;
        })}{" "}
      </>
    );
  }, [resultsFound]);

  return (
    <Center w="100%" h="100%">
      <VStack
        mt={5}
        bg="brand.100"
        pt={4}
        px={6}
        pb={8}
        borderRadius="30px"
        width="95%"
        maxWidth="65rem"
      >
        <InputGroup>
          <InputLeftElement
            pointerEvents="none"
            children={<SearchIcon color="gray.300" />}
          />
          <Input
            placeholder="Search"
            variant="filled"
            onChange={handleSearchInputChange}
          />
        </InputGroup>
        <VStack w="100%" gap={3} pt={3}>
          {result}
        </VStack>
      </VStack>
    </Center>
  );
}

export default SocialPage;
