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
      <Flex direction="row" justifyContent="space-between">
        <Text fontWeight={600} fontSize="md" textAlign="center">
          {title}
        </Text>
        <HStack>
          <Text fontWeight={200} fontSize="md" textAlign="center">
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
