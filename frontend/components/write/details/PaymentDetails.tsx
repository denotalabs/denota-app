import MetadataBox from "../metadata/MetadataBox";
import { CurrencySelectorField } from "./CurrencySelectorField";
import PaymentFields from "./PaymentFields";
import { PaymentTypeField } from "./PaymentTypeField";

interface Props {
  token: string;
  mode: string;
  showMetadata?: boolean;
}
function PaymentDetails({ token, mode, showMetadata }: Props) {
  return (
    <>
      <CurrencySelectorField />
      <PaymentFields token={token} mode={mode} />
      <PaymentTypeField />
      {showMetadata && <MetadataBox />}
    </>
  );
}

export default PaymentDetails;
