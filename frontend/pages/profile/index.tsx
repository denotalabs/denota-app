import { Center, VStack } from "@chakra-ui/react";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import DetailsRow from "../../components/designSystem/DetailsRow";
import DetailsBox from "../../components/onramps/DetailsBox";
import { useFormatAddress } from "../../hooks/useFormatAddress";

const DenotaProfile = () => {
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [subaccountAddress, setSubaccountAddress] = useState<
    string | undefined
  >();

  const { formatAddress } = useFormatAddress();

  const fetchUser = useCallback(async () => {
    const response = await axios.get("https://denota.klymr.me/user", {
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token"),
      },
    });
    if (response.data) {
      setUserEmail(response.data.email);
      setSubaccountAddress(response.data.subaccount_address);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (!(userEmail || subaccountAddress)) {
    return <></>;
  }

  return (
    <Center w="100%" h="100%">
      <VStack>
        <DetailsBox w={500} bg="brand.100">
          <DetailsRow title="Email" value={userEmail} />
          <DetailsRow
            title="Subaccount Address"
            value={formatAddress(subaccountAddress)}
            copyValue={subaccountAddress}
          />
        </DetailsBox>
      </VStack>
    </Center>
  );
};

export default DenotaProfile;
