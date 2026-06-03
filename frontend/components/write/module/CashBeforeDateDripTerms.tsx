import { Flex, Stack } from "@chakra-ui/react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useTokens } from "../../../hooks/useTokens";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import DateTimeLocalField from "../../fields/input/DateTimeLocalField";
import DripPeriodField from "../../fields/input/DripPeriodField";
import TokenAmountField from "../../fields/input/TokenAmountField";

export function CashBeforeDateDripTerms() {
  const { notaFormValues } = useNotaForm();
  const { displayNameForCurrency } = useTokens();

  const token = (notaFormValues.token as NotaCurrency) ?? "UNKNOWN";
  const tokenLabel = displayNameForCurrency(token);

  return (
    <Flex flexWrap={"wrap"} direction={"column"}>
      <Stack spacing={5}>
        <DripPeriodField helperText="How long to wait between each drip claim." />
        <TokenAmountField
          fieldName="dripAmount"
          label={`Drip amount (${tokenLabel}):`}
          token={token}
          helperText={`Amount released each drip period. Escrow total is ${notaFormValues.amount || "0"} ${tokenLabel}.`}
        />
        <DateTimeLocalField
          fieldName="expirationDate"
          label="Must claim before:"
          helperText="Required. Time is local and includes seconds."
        />
      </Stack>
    </Flex>
  );
}
