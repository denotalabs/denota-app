import RoundedBox from "../../designSystem/RoundedBox";
import { CurrencySelectorField } from "./CurrencySelectorField";
import PaymentFields from "./PaymentFields";

interface Props {
  token: string;
  mode: string;
}
function PaymentDetails({ token, mode }: Props) {
  return (
    <RoundedBox padding={4} mb={6}>
      <CurrencySelectorField />
      <PaymentFields token={token} mode={mode} />
    </RoundedBox>
  );
}

export default PaymentDetails;
