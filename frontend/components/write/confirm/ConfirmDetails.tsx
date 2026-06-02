import { VStack } from "@chakra-ui/react";
import { isAddress } from "ethers/lib/utils";
import { useMemo } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useEnsNames } from "../../../hooks/useEnsNames";
import { useTokens } from "../../../hooks/useTokens";
import { getEffectiveAddress } from "../../../utils/ensAddress";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

function ConfirmDetails() {
  const { notaFormValues } = useNotaForm();
  const { displayNameForCurrency } = useTokens();

  const recipient = getEffectiveAddress(
    notaFormValues.address,
    notaFormValues.resolvedAddress
  );

  const ensAddresses = useMemo(() => {
    const addresses = [recipient];
    const arbitrator = notaFormValues.arbitrator;
    if (arbitrator && isAddress(arbitrator)) {
      addresses.push(arbitrator);
    }
    return addresses;
  }, [recipient, notaFormValues.arbitrator]);
  const ensNames = useEnsNames(ensAddresses);

  const showInspector =
    notaFormValues.module === "reversibleRelease" ||
    notaFormValues.module === "reversibleByBeforeDate";
  const showExpiration =
    notaFormValues.module === "cashBeforeDate" ||
    notaFormValues.module === "reversibleByBeforeDate";

  return (
    <RoundedBox p={6}>
      <VStack>
        <DetailsRow
          title="Recipient address"
          value={recipient}
          ensNames={ensNames}
        />
        <DetailsRow
          title="Payment Amount"
          value={
            notaFormValues.amount +
            " " +
            displayNameForCurrency(notaFormValues.token as NotaCurrency)
          }
        />
        {showInspector && (
          <DetailsRow
            title="Inspector"
            ensNames={ensNames}
            value={notaFormValues.arbitrator ?? "Self-signed"}
          />
        )}
        {showExpiration && (
          <DetailsRow
            title="Expiration Date"
            value={notaFormValues.expirationDate}
          />
        )}
      </VStack>
    </RoundedBox>
  );
}

export default ConfirmDetails;
