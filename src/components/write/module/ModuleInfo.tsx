import { useMemo } from "react";
import RoundedBox from "../../designSystem/RoundedBox";
import { DirectPay } from "./DirectPayModule";
import { Escrow } from "./EscrowModule";
import { MilestoneModule } from "./MilestoneModule";

const moduleForIndex = (index: number) => {
  switch (index) {
    case 0:
      return "direct";
    case 1:
      return "escrow";
    case 2:
      return "milestone";
    default:
      return "direct";
  }
};

const indexForModule = (module: string) => {
  switch (module) {
    case "direct":
      return 0;
    case "escrow":
      return 1;
    case "milestone":
      return 2;
    default:
      return 0;
  }
};

interface Props {
  module: string;
  isInvoice: boolean;
}

function ModuleInfo({ module, isInvoice }: Props) {
  const selectedModule = useMemo(() => {
    switch (module) {
      case "direct":
        return <DirectPay isInvoice={isInvoice} />;
      case "escrow":
        return <Escrow />;
      case "milestone":
        return <MilestoneModule />;
      default:
        return <DirectPay isInvoice={isInvoice} />;
    }
  }, [isInvoice, module]);

  return <RoundedBox padding={6}>{selectedModule}</RoundedBox>;
}

export default ModuleInfo;
