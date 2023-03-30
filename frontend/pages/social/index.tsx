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
  title: "vitalik.eth",
  items: [
    {
      title: "1/5/2023 | MakerDAO.eth",
      description: "Invoice | 12 wETH | ONGOING",
      subItems: [
        { title: "10/01/2022", description: "Invoice created" },
        { title: "10/25/2022", description: "Milestone #1 paid" },
        { title: "11/18/2022", description: "Milestone #2 paid" },
        { title: "1/5/2023", description: "Milestone #3 paid" },
      ],
    },
    { title: "12/9/2019 | Bankless.eth", description: "0.2 wETH | PAID" },
  ],
};

const fakeResult2 = {
  title: "vitalik2.eth",
  items: [
    {
      title: "6/6/2018 | vitalik.eth",
      description: "Invoice | 0.1 rBTC | PAID",
    },
  ],
};

const fakeResults = [fakeResult1, fakeResult2];

function SocialPage() {
  const [searchValue, setSearchValue] = useState("");

  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const resultsFound = useMemo(() => {
    return searchValue.includes("vita");
  }, [searchValue]);
  return (
    <Center w="100%" h="100%">
      <VStack
        mt={5}
        bg="brand.100"
        pt={4}
        px={6}
        pb={8}
        borderRadius="30px"
        width="100%"
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
        {resultsFound && (
          <VStack w="100%" gap={3} pt={3}>
            {fakeResults.map((item) => {
              return <SearchResult {...item} />;
            })}
          </VStack>
        )}
      </VStack>
    </Center>
  );
}

export default SocialPage;
