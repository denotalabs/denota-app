interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqModuleStep({ isInvoice }: Props) {
  return <>{isInvoice ? "Invoice" : "Cheq"}</>;
}

export default CheqModuleStep;
