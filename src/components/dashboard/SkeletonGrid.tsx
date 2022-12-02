import { Grid, Skeleton } from "@chakra-ui/react";

function SkeletonGrid() {
  return (
    <Grid templateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap={6}>
      <Skeleton w="100%" h="210" borderRadius={"10px"} />
      <Skeleton w="100%" h="210" borderRadius={"10px"} />
      <Skeleton w="100%" h="210" borderRadius={"10px"} />
      <Skeleton w="100%" h="210" borderRadius={"10px"} />
      <Skeleton w="100%" h="210" borderRadius={"10px"} />
      <Skeleton w="100%" h="210" borderRadius={"10px"} />
    </Grid>
  );
}

export default SkeletonGrid;
