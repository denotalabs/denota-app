import { Box, Text } from "@chakra-ui/react";
import DetailsRow from "../designSystem/DetailsRow";
import RoundedBox from "../designSystem/RoundedBox";

interface SubItem {
  title: string;
  description: string;
}

interface Item {
  title: string;
  description: string;
  subItems?: SubItem[];
}

interface Props {
  title: string;
  items: Item[];
}

function SearchResult({ title, items }: Props) {
  return (
    <RoundedBox p={4}>
      <Text fontSize="lg">{title}</Text>

      <Box pl={6}>
        {items.map((item, index) => {
          return <SearchResultItem key={index} {...item} />;
        })}
      </Box>
    </RoundedBox>
  );
}

function SearchResultItem({ title, description, subItems }: Item) {
  return (
    <>
      <DetailsRow
        title={title}
        value={description}
        link="https://denota.xyz"
        fontColor="gray.400"
      />
      {subItems && (
        <Box pl={6}>
          {subItems.map((item) => {
            return (
              <DetailsRow
                title={item.title}
                value={item.description}
                fontColor="gray.400"
              />
            );
          })}
        </Box>
      )}
    </>
  );
}

export default SearchResult;
