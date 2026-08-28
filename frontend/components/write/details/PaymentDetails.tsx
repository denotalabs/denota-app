import MetadataBox from "../metadata/MetadataBox";
import { CurrencySelectorField } from "./CurrencySelectorField";
import PaymentFields from "./PaymentFields";
import { PaymentTypeField } from "./PaymentTypeField";

interface Props {
  showMetadata?: boolean;
}

function PaymentDetails({ showMetadata }: Props) {
  return (
    <>
      <PaymentTypeField />
      <CurrencySelectorField />
      <PaymentFields />
      {showMetadata && <MetadataBox />}
    </>
  );
}

export default PaymentDetails;
