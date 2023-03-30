import { SearchIcon } from "@chakra-ui/icons";
import {
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
} from "@chakra-ui/react";
import { ChangeEvent, useMemo, useState } from "react";
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
            <RoundedBox h="340px" p={4}>
              Search result 1
            </RoundedBox>
            <RoundedBox h="168px" p={4}>
              Search result 2
            </RoundedBox>
          </>
        )}
      </VStack>
    </Center>
  );
}

export default SocialPage;
