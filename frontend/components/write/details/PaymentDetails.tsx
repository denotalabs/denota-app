import MetadataBox from "../metadata/MetadataBox";
import PaymentFields from "./PaymentFields";
import { PaymentTypeField } from "./PaymentTypeField";

interface Props {
  showMetadata?: boolean;
}

function PaymentDetails({ showMetadata }: Props) {
  return (
    <>
      <PaymentTypeField />
      <PaymentFields />
      {showMetadata && <MetadataBox />}
    </>
  );
}

export default PaymentDetails;
