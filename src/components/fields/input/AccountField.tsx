import { Field } from "formik";

import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";

interface Props {
  fieldName: string;
  placeholder: string;
}

function AccountField({ fieldName, placeholder }: Props) {
  const { blockchainState } = useBlockchainData();
  const [hasStarted, setHasStarted] = useState(false);

  function validateAddress(value: string) {
    setHasStarted(true);

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
        console.log(errors);

        return (
          <FormControl isInvalid={errors.address && hasStarted}>
            <FormLabel noOfLines={1} flexShrink={0}>
              Client Address
            </FormLabel>
            <Input {...field} placeholder={placeholder} />
            <FormErrorMessage>{errors.address}</FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
}

export default AccountField;
