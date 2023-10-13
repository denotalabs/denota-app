import { Center, Text, VStack } from "@chakra-ui/react";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const DenotaProfile = () => {
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [subaccountAddress, setSubaccountAddress] = useState<
    string | undefined
  >();

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

  return (
    <Center w="100%" h="100%">
      <VStack>
        <Text>{`Email Address: ${userEmail}`}</Text>
        <Text>{`Subaccount Address: ${subaccountAddress}`}</Text>
      </VStack>
    </Center>
  );
};

export default DenotaProfile;
