import { Field, FieldProps } from "formik";

import {
  FormControl,
  FormErrorMessage,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from "@chakra-ui/react";
import { useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";

interface Props {
  token: string;
  mode: string;
}

function AmountField({ token, mode }: Props) {
  const { blockchainState } = useBlockchainData();
  const [hasStarted, setHasStarted] = useState(false);

  function validateAmount(value: number) {
    setHasStarted(true);
    if (value <= 0) {
      return "Value must be greater than 0";
    }
    // TODO (THIS PR): fix validation
    // if (mode === "pay") {
    //   switch (token) {
    //     case "DAI":
    //       if (Number(blockchainState.userDaiBalance) < value) {
    //         return "Insufficient balance";
    //       }
    //       break;
    //     case "WETH":
    //       if (Number(blockchainState.userWethBalance) < value) {
    //         return "Insufficient balance";
    //       }
    //       break;
    //     case "NATIVE":
    //       if (Number(blockchainState.walletBalance) < value) {
    //         return "Insufficient balance";
    //       }
    //       break;
    //   }
    // }
    return undefined;
  }
  return (
    <Field name="amount" validate={validateAmount}>
      {({ field, form: { setFieldValue, errors, values } }: FieldProps) => {
        return (
          <FormControl isInvalid={errors.amount && hasStarted}>
            <NumberInput
              {...field}
              onChange={(val) => setFieldValue(field.name, val)}
              precision={2}
              step={1}
              min={0}
              value={values.amount}
              // TODO add max, set by user's balance
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormErrorMessage>
              {errors.amount && errors.amount.toString()}
            </FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
}

export default AmountField;
