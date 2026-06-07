import { Text } from "@chakra-ui/react";
import { isAddress } from "ethers/lib/utils";
import { useMemo } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useEnsNames } from "../../../hooks/useEnsNames";
import { useTokens } from "../../../hooks/useTokens";
import { getEffectiveAddress } from "../../../utils/ensAddress";
import { buildPaymentStory } from "../../../utils/paymentStory";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import RoundedBox from "../../designSystem/RoundedBox";

function ConfirmNotice() {
  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();
  const { displayNameForCurrency } = useTokens();
  const senderAddress = blockchainState.account ?? "";

  const recipient = getEffectiveAddress(
    notaFormValues.address,
    notaFormValues.resolvedAddress
  );

  const inspector = getEffectiveAddress(
    notaFormValues.auditor,
    notaFormValues.resolvedAuditor
  );

  const ensAddresses = useMemo(() => {
    const addresses: string[] = [];
    if (recipient && isAddress(recipient)) {
      addresses.push(recipient);
    }
    if (inspector && isAddress(inspector)) {
      addresses.push(inspector);
    }
    if (senderAddress && isAddress(senderAddress)) {
      addresses.push(senderAddress);
    }
    return addresses;
  }, [recipient, inspector, senderAddress]);

  const ensNames = useEnsNames(ensAddresses);

  const story = useMemo(
    () =>
      buildPaymentStory({
        formValues: notaFormValues,
        senderAddress,
        ensNames,
        tokenLabel: displayNameForCurrency(
          notaFormValues.token as NotaCurrency
        ),
      }),
    [displayNameForCurrency, ensNames, notaFormValues, senderAddress]
  );

  return (
    <RoundedBox mb={5} padding={6}>
      <Text fontWeight={600} fontSize="xl" textAlign="center">
        Payment story
      </Text>
      <Text fontSize="md" textAlign="center" mt={3} lineHeight="tall">
        {story}
      </Text>
      {/* <Text
        fontSize="sm"
        color="whiteAlpha.700"
        textAlign="center"
        mt={4}
      >
        A nota NFT is issued for tracking
      </Text> */}
    </RoundedBox>
  );
}

export default ConfirmNotice;
