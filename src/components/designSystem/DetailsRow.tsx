import { ExternalLinkIcon } from "@chakra-ui/icons";

import { Box, Flex, HStack, Link, Text } from "@chakra-ui/react";

interface Props {
  title: string;
  value: string;
  link?: string | null;
}

function DetailsRow({ title, value, link }: Props) {
  return (
    <Box py={3} w="100%">
      <Flex direction="row" justifyContent="space-between" maxW="100%">
        <Text
          fontWeight={600}
          fontSize="md"
          textAlign="left"
          flexShrink={0}
          noOfLines={1}
        >
          {title}
        </Text>
        <HStack minWidth={0} pl={4}>
          <Text fontWeight={200} fontSize="md" textAlign="right" noOfLines={1}>
            {value}
          </Text>
          {link && (
            <Link href={link} isExternal>
              <ExternalLinkIcon mb={1} />
            </Link>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}

export default DetailsRow;
