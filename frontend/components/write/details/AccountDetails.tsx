import { FormControl, FormHelperText, FormLabel, Text } from "@chakra-ui/react";
import useDemoMode from "../../../hooks/useDemoMode";
import ContactSelector from "../../contacts/ContactSelector";
import RoundedBox from "../../designSystem/RoundedBox";
import AccountField from "../../fields/input/AccountField";

function AccountDetails() {
  const isDemoMode = useDemoMode();
  return (
    <RoundedBox padding={4} mb={6}>
      {isDemoMode ? (
        <FormControl>
          <FormLabel mb={2}>Recipient</FormLabel>
          <FormHelperText mt={0} mb={2}>
            <Text as="i">Wallet address, ENS, or Lens</Text>
          </FormHelperText>
          <ContactSelector
            fieldName="Select Contact"
            placeholder="Select contact..."
          />
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
