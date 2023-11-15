import { Center, Spinner, VStack } from "@chakra-ui/react";
import axios from "axios";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import DetailsRow from "../../components/designSystem/DetailsRow";
import DetailsBox from "../../components/onramps/DetailsBox";
import erc20 from "../../frontend-abi/ERC20.sol/TestERC20.json";
import { useFormatAddress } from "../../hooks/useFormatAddress";

const DenotaProfile = () => {
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [subaccountAddress, setSubaccountAddress] = useState<
    string | undefined
  >();
  const [userBalance, setUserBalance] = useState<string | undefined>();
  const [reserveBalance, setReserveBalance] = useState<string | undefined>();

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

    const usdc = new ethers.Contract(
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      erc20.abi,
      new ethers.providers.JsonRpcProvider("https://polygon-rpc.com/")
    );

    const formattedUserBalance = String(
      parseFloat(
        ethers.utils.formatUnits(
          await usdc.balanceOf(response.data.subaccount_address),
          6
        )
      ).toFixed(2)
    );
    const formattedReserveBalance = String(
      parseFloat(
        ethers.utils.formatUnits(
          await usdc.balanceOf("0x16E421294cB4d084D7BD52FaF4183cEffff1cF23"),
          6
        )
      ).toFixed(2)
    );

    setUserBalance(formattedUserBalance);
    setReserveBalance(formattedReserveBalance);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (!(userEmail && subaccountAddress && userBalance && reserveBalance)) {
    return (
      <Center w="100%" h="100%">
        <Spinner size="xl" />
      </Center>
    );
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
          <DetailsRow
            title="Subaccount Balance"
            value={`${userBalance} USDC`}
          />
          <DetailsRow
            title="Reserve Balance"
            value={`${reserveBalance} USDC`}
          />
        </DetailsBox>
      </VStack>
    </Center>
  );
};

export default DenotaProfile;
