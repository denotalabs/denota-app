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
      <CurrencySelectorField />
      <PaymentFields />
      <PaymentTypeField />
      {showMetadata && <MetadataBox />}
    </>
  );
}

export default PaymentDetails;
