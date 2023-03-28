import { Field } from "formik";

import { FormControl, FormErrorMessage, Input } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";

interface Props {
  fieldName: string;
  placeholder: string;
  isRequired?: boolean;
}

function AccountField({ fieldName, placeholder, isRequired = true }: Props) {
  const { blockchainState } = useBlockchainData();
  const [hasStarted, setHasStarted] = useState(false);

  function validateAddress(value: string) {
    if (value !== "") {
      setHasStarted(true);
    }

    if (!isRequired && value === "") {
      return undefined;
    }

    let error;
    if (blockchainState.account === value) {
      error = "Can't self send";
    }
    if (!ethers.utils.isAddress(value)) {
      error = "Invalid address";
    }
    return error;
  }

  return (
    <Field name={fieldName} validate={validateAddress}>
      {({ field, form: { errors, touched } }: any) => {
        return (
          <FormControl
            isInvalid={errors[fieldName] && (touched[fieldName] || hasStarted)}
          >
            <Input {...field} placeholder={placeholder} />
            <FormErrorMessage>{errors[fieldName]}</FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
}

export default AccountField;
