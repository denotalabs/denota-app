import { useMemo } from "react";
import RoundedBox from "../../designSystem/RoundedBox";
import { DirectPayTerms } from "./DirectPayTerms";
import { EscrowTerms } from "./EscrowTerms";
import { MilestoneTerms } from "./MilestoneTerms";

interface Props {
  module: string;
  isInvoice: boolean;
}

function ModuleTerms({ module, isInvoice }: Props) {
  const selectedModule = useMemo(() => {
    switch (module) {
      case "direct":
        return <DirectPayTerms isInvoice={isInvoice} />;
      case "escrow":
        return <EscrowTerms />;
      case "milestone":
        return <MilestoneTerms />;
      default:
        return <DirectPayTerms isInvoice={isInvoice} />;
    }
  }, [isInvoice, module]);

  return <RoundedBox padding={6}>{selectedModule}</RoundedBox>;
}

export default ModuleTerms;
