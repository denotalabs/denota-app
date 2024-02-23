import { FormControl, FormLabel } from "@chakra-ui/react";
import RoundedBox from "../../designSystem/RoundedBox";
import AccountField from "../../fields/input/AccountField";

interface AccountDetailsProps {
  onSelectContact: (address: string) => void;
}

function AccountDetails({ onSelectContact }: AccountDetailsProps) {
  return (
    <RoundedBox padding={4} mb={6}>
      <FormControl>
        <FormLabel mb={2}>Recipient Address</FormLabel>
        <AccountField fieldName="address" placeholder="0x..." />
      </FormControl>
    </RoundedBox>
  );
}

export default AccountDetails;
