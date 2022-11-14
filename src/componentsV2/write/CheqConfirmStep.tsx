interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqConfirmStep({ isInvoice }: Props) {
  return <>{isInvoice ? "Invoice" : "Cheq"}</>;
}

export default CheqConfirmStep;
