import { Box, Center, Grid, GridItem } from "@chakra-ui/react";

function MyCheqsView() {
  return (
    <Box bg='red' height={500} width='100%' p={6}>
      <Grid templateColumns='repeat(2, 1fr)' gap={6}>
        <GridItem w='100%' h='210' bg='blue.500' />
        <GridItem w='100%' h='210' bg='blue.500' />
        <GridItem w='100%' h='210' bg='blue.500' />
        <GridItem w='100%' h='210' bg='blue.500' />
      </Grid>
    </Box>
  );
}

export default MyCheqsView;
