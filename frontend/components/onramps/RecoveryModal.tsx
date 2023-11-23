import {
  Alert,
  AlertIcon,
  AlertTitle,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotas } from "../../context/NotaDataProvider";
import erc20 from "../../frontend-abi/ERC20.sol/TestERC20.json";
import RoundedButton from "../designSystem/RoundedButton";
import SimpleModal from "../designSystem/SimpleModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onchainId: string;
  paymentAmount: number;
}

function RecoveryModal(props: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSufficientBalance, setHasSufficientBalance] = useState<
    boolean | undefined
  >(undefined);
  const { refresh } = useNotas();
  const toast = useToast();

  const fetchData = useCallback(async () => {
    const usdc = new ethers.Contract(
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      erc20.abi,
      new ethers.providers.JsonRpcProvider("https://polygon-rpc.com/")
    );

    const reserveBalance = parseFloat(
      ethers.utils.formatUnits(
        await usdc.balanceOf("0x16E421294cB4d084D7BD52FaF4183cEffff1cF23"),
        6
      )
    );

    if (reserveBalance > props.paymentAmount) {
      setHasSufficientBalance(true);
    } else {
      setHasSufficientBalance(false);
    }
  }, [props.paymentAmount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startRecovery = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://denota.klymr.me/recovery",
        {
          notaId: props.onchainId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token"),
          },
        }
      );
      if (response.data) {
        refresh();
        toast({
          title: "Recovery started",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        props.onClose();
      } else {
        toast({
          title: "Recovery error",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Recovery error",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [props, refresh, toast]);

  const content = useMemo(() => {
    switch (hasSufficientBalance) {
      case undefined:
        return <></>;
      case true:
        return (
          <RoundedButton onClick={startRecovery} isLoading={isLoading}>
            Start Recovery Process
          </RoundedButton>
        );
      case false:
        return (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Reserve pool balance insufficient</AlertTitle>
          </Alert>
        );
    }
  }, [hasSufficientBalance, isLoading, startRecovery]);

  return (
    <SimpleModal {...props}>
      <VStack gap={4} mt={10} mb={6}>
        <Text>{`Payment Recovery`}</Text>
        <Text>
          Denota is built on smart contracts and DeFi so the recovery process is
          transparent and efficient.
        </Text>

        {content}
      </VStack>
    </SimpleModal>
  );
}

export default RecoveryModal;
