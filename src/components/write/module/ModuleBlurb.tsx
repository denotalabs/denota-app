import { useMemo } from "react";

import { Text } from "@chakra-ui/react";

import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  module: string;
}

function ModuleBlurb({ module }: Props) {
  const blurb = useMemo(() => {
    if (module === "self") {
      return "The self-signed module allows the funder to void the cheq until the maturity date (get better copy)";
    }
    return "Module not implemented yet. Please don't select";
  }, [module]);
  return (
    <RoundedBox padding={6} mt={4}>
      <Text fontWeight={600} textAlign={"center"}>
        {blurb}
      </Text>
    </RoundedBox>
  );
}

export default ModuleBlurb;
