import { FormControl, FormHelperText, FormLabel, Text } from "@chakra-ui/react";
import useDemoMode from "../../../hooks/useDemoMode";
import ContactBar from "../../contacts/ContactBar";
import RoundedBox from "../../designSystem/RoundedBox";
import AccountField from "../../fields/input/AccountField";

interface AccountDetailsProps {
  onSelectContact: (address: string) => void;
}

function AccountDetails({ onSelectContact }: AccountDetailsProps) {
  const isDemoMode = useDemoMode();
  return (
    <RoundedBox padding={4} mb={6}>
      {isDemoMode ? (
        <FormControl>
          <FormLabel mb={2}>Recipient</FormLabel>
          <FormHelperText mt={0} mb={2}>
            <Text as="i">Wallet address, ENS, or Lens</Text>
          </FormHelperText>
          <ContactBar onSelectContact={onSelectContact} />
        </FormControl>
      ) : (
        <FormControl>
          <FormLabel mb={2}>Client Address</FormLabel>
          <AccountField fieldName="address" placeholder="0x..." />
        </FormControl>
      )}
    </RoundedBox>
  );
}

export default AccountDetails;
