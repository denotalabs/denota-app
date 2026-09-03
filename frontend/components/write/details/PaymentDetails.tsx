import AttachmentsBox from "../attachments/AttachmentsBox";
import PaymentFields from "./PaymentFields";
import { PaymentTypeField } from "./PaymentTypeField";

interface Props {
  showAttachments?: boolean;
}

function PaymentDetails({ showAttachments }: Props) {
  return (
    <>
      <PaymentTypeField />
      <PaymentFields />
      {showAttachments && <AttachmentsBox />}
    </>
  );
}

export default PaymentDetails;
