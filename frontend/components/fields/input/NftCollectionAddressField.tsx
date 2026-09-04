import { InfoOutlineIcon } from "@chakra-ui/icons";
import {
  FormControl,
  FormErrorMessage,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { Field, FieldProps } from "formik";
import { useCallback, useEffect, useRef, useState } from "react";

import { useErc721ContractCheck } from "../../../hooks/useErc721ContractCheck";
import NftCollectionVerifiedModal from "./NftCollectionVerifiedModal";

interface Props {
  fieldName: string;
  placeholder?: string;
}

interface InnerProps extends Props {
  field: FieldProps["field"];
  form: FieldProps["form"];
  touched: boolean;
  hasStarted: boolean;
  onInputStarted: () => void;
}

function NftCollectionAddressFieldInner({
  fieldName,
  field,
  form,
  touched,
  hasStarted,
  onInputStarted,
  placeholder = "0x…",
}: InnerProps) {
  const { setStatus } = form;
  const checkedAddress = ethers.utils.isAddress(field.value)
    ? field.value
    : undefined;
  const { isErc721, contractName, isLoading } =
    useErc721ContractCheck(checkedAddress);

  const dismissedAddresses = useRef(new Set<string>());
  const [verifiedModalAddress, setVerifiedModalAddress] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Formik's setStatus replaces `status`; it does not accept an updater.
    setStatus({
      erc721Checking: isLoading && !!checkedAddress,
      erc721Address: checkedAddress?.toLowerCase() ?? "",
      erc721IsErc721: isLoading ? null : isErc721,
    });
  }, [checkedAddress, isErc721, isLoading, setStatus]);

  const fieldError = form.errors[fieldName] as string | undefined;
  const hasInteracted = touched || hasStarted;
  const showError = Boolean(fieldError && hasInteracted);
  const isVerifiedContract =
    !isLoading && isErc721 === true && !!checkedAddress;
  const showVerified = hasInteracted && isVerifiedContract;

  const openVerifiedModal = useCallback(() => {
    if (checkedAddress && isVerifiedContract) {
      setVerifiedModalAddress(checkedAddress);
    }
  }, [checkedAddress, isVerifiedContract]);

  useEffect(() => {
    if (!showVerified || !checkedAddress) {
      return;
    }
    const key = checkedAddress.toLowerCase();
    if (dismissedAddresses.current.has(key)) {
      return;
    }
    setVerifiedModalAddress(checkedAddress);
  }, [checkedAddress, showVerified]);

  const closeVerifiedModal = useCallback(() => {
    if (verifiedModalAddress) {
      dismissedAddresses.current.add(verifiedModalAddress.toLowerCase());
    }
    setVerifiedModalAddress(null);
  }, [verifiedModalAddress]);

  return (
    <>
      <FormControl isInvalid={showError}>
        <InputGroup>
          <Input
            {...field}
            pr="2.75rem"
            placeholder={placeholder}
            onChange={(event) => {
              if (event.target.value !== "") {
                onInputStarted();
              }
              field.onChange(event);
            }}
          />
          <InputRightElement width="2.75rem">
            <IconButton
              aria-label="NFT contract verification details"
              icon={<InfoOutlineIcon />}
              size="sm"
              variant="ghost"
              isDisabled={!isVerifiedContract}
              onClick={openVerifiedModal}
            />
          </InputRightElement>
        </InputGroup>
        {isLoading && checkedAddress ? (
          <Text color="gray.400" fontSize="sm" mt={1}>
            Verifying ERC-721 contract…
          </Text>
        ) : showVerified ? (
          <Text color="green.500" fontSize="sm" mt={1}>
            {contractName
              ? `NFT contract verified (${contractName})`
              : "NFT contract verified"}
          </Text>
        ) : (
          <FormErrorMessage>{fieldError}</FormErrorMessage>
        )}
      </FormControl>
      <NftCollectionVerifiedModal
        isOpen={!!verifiedModalAddress}
        onClose={closeVerifiedModal}
        address={verifiedModalAddress ?? checkedAddress ?? ""}
        contractName={contractName}
      />
    </>
  );
}

function NftCollectionAddressField({
  fieldName,
  placeholder,
}: Props) {
  const [hasStarted, setHasStarted] = useState(false);
  const onInputStarted = useCallback(() => {
    setHasStarted(true);
  }, []);

  return (
    <Field name={fieldName}>
      {({ field, form }: FieldProps) => (
        <NftCollectionAddressFieldInner
          fieldName={fieldName}
          field={field}
          form={form}
          touched={Boolean(form.touched[fieldName])}
          hasStarted={hasStarted}
          onInputStarted={onInputStarted}
          placeholder={placeholder}
        />
      )}
    </Field>
  );
}

export default NftCollectionAddressField;
