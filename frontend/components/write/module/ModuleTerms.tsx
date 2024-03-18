import { Box } from "@chakra-ui/react";
import { useMemo } from "react";
import { DirectPayTerms } from "./DirectPayTerms";
import { EscrowTerms } from "./EscrowTerms";
import { MilestoneTerms } from "./MilestoneTerms";
import { MotionBox } from "./MotionBox";
import { SimpleCashTerms } from "./SimpleCashTerms";

interface Props {
  module: string;
}

function ModuleTerms({ module }: Props) {
  const selectedModule = useMemo(() => {
    switch (module) {
      case "directSend":
        return <DirectPayTerms />;
      case "reversibleRelease":
        return <EscrowTerms />;
      case "milestone":
        return <MilestoneTerms />;
      case "simpleCash":
        return <SimpleCashTerms />;
      default:
        return <DirectPayTerms />;
    }
  }, [module]);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      mb={4}
    >
      <Box pt={4}>{selectedModule}</Box>
    </MotionBox>
  );
}

export default ModuleTerms;
