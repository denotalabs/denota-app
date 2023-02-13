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
}

function ModuleInfo({ module }: Props) {
  const selectedModule = useMemo(() => {
    switch (module) {
      case "direct":
        return <DirectPay />;
      case "escrow":
        return <Escrow />;
      case "milestone":
        return <MilestoneModule />;
      default:
        return <DirectPay />;
    }
  }, [module]);

  return <RoundedBox padding={6}>{selectedModule}</RoundedBox>;
}

export default ModuleInfo;
