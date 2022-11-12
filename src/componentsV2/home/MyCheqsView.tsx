import { Box, Center, Grid, GridItem, Text } from "@chakra-ui/react";

function MyCheqsView() {
  return (
    <Box boxShadow='outline' width='100%' p={6}>
      <Grid templateColumns='repeat(2, 1fr)' gap={6}>
        <GridItem w='100%' h='210' bg='blue.500' p={2}>
          <Text fontWeight={400} fontSize={"2xl"}>
            Cheq 1
          </Text>
        </GridItem>
        <GridItem w='100%' h='210' bg='blue.500' p={2}>
          <Text fontWeight={400} fontSize={"2xl"}>
            Cheq 2
          </Text>
        </GridItem>
        <GridItem w='100%' h='210' bg='blue.500' p={2}>
          <Text fontWeight={400} fontSize={"2xl"}>
            Cheq 3
          </Text>
        </GridItem>
        <GridItem w='100%' h='210' bg='blue.500' p={2}>
          <Text fontWeight={400} fontSize={"2xl"}>
            Cheq 4
          </Text>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default MyCheqsView;
