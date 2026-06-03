import { Box } from "@chakra-ui/react";
import { useMemo } from "react";
import { CashBeforeDateDripTerms } from "./CashBeforeDateDripTerms";
import { ClaimableTerms } from "./ClaimableTerms";
import { DirectPayTerms } from "./DirectPayTerms";
import { EscrowTerms } from "./EscrowTerms";
import { MilestoneTerms } from "./MilestoneTerms";
import { MotionBox } from "./MotionBox";

interface Props {
  module: string;
}

function ModuleTerms({ module }: Props) {
  const moduleNameToCard = {
    directSend: "Direct",
    claimable: "Claimable",
    cashBeforeDate: "Claimable",
    simpleCash: "Claimable",
    reversibleRelease: "Reversible",
    reversibleByBeforeDate: "Reversible",
    cashBeforeDateDrip: "CashBeforeDateDrip",
    milestone: "Drip",
    // "": "Cancelable",
    // "": "Grant",
    // "": "Condition",
  };

  const selectedModule = useMemo(() => {
    const moduleType = moduleNameToCard[module];
    switch (moduleType) {
      case "Claimable":
        return <ClaimableTerms />;
      case "Direct":
        return <DirectPayTerms />;
      case "Reversible":
        return <EscrowTerms />;
      case "CashBeforeDateDrip":
        return <CashBeforeDateDripTerms />;
      case "Drip":
        return <MilestoneTerms />;
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
