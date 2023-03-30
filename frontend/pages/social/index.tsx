import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ChangeEvent, useMemo, useState } from "react";
import DetailsRow from "../../components/designSystem/DetailsRow";
import RoundedBox from "../../components/designSystem/RoundedBox";

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
          <>
            <RoundedBox p={4}>
              <Text fontSize="lg">vitalik.eth</Text>

              <Box pl={6}>
                <DetailsRow
                  title="1/5/2023 | MakerDAO.eth"
                  value="Invoice | 12 wETH | ONGOING"
                />
                <Box pl={6}>
                  <DetailsRow title="10/01/2022" value="Invoice created" />
                  <DetailsRow title="10/25/2022" value="Milestone #1 paid" />
                  <DetailsRow title="11/18/2022" value="Milestone #2 paid" />
                  <DetailsRow title="1/5/2023" value="Milestone #3 paid" />
                </Box>
                <DetailsRow
                  title="12/9/2019 | Bankless.eth"
                  value="0.2 wETH | PAID"
                />
              </Box>
            </RoundedBox>
            <RoundedBox p={4}>
              <Text fontSize="lg">vitalik2.eth</Text>
              <Box pl={6}>
                <DetailsRow
                  title="6/6/2018 | vitalik.eth"
                  value="Invoice | 0.1 rBTC | PAID"
                />
              </Box>
            </RoundedBox>
          </>
        )}
      </VStack>
    </Center>
  );
}

export default SocialPage;
