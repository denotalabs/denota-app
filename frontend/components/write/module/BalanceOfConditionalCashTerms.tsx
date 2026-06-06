import {
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  NumberInput,
  NumberInputField,
  Select,
  Stack,
} from "@chakra-ui/react";
import { Field, FieldProps } from "formik";
import {
  CONDITION_TYPE_LABELS,
  CONDITION_TYPES,
} from "../../../utils/balanceOfConditionalCash";
import DateTimeLocalField from "../../fields/input/DateTimeLocalField";
import NftCollectionAddressField from "../../fields/input/NftCollectionAddressField";

export function BalanceOfConditionalCashTerms() {
  return (
    <Flex flexWrap="wrap" direction="column">
      <Stack spacing={5}>
        <FormControl>
          <FormLabel>NFT collection address</FormLabel>
          <NftCollectionAddressField fieldName="nftCollectionAddress" />
          <FormHelperText>
            ERC-721 contract whose balanceOf(owner) is checked when the
            recipient claims.
          </FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel>Condition</FormLabel>
          <Field name="conditionType">
            {({ field, form }: FieldProps) => (
              <Select
                value={field.value}
                onChange={(event) =>
                  form.setFieldValue("conditionType", event.target.value)
                }
              >
                {CONDITION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CONDITION_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <FormHelperText>
            How the recipient&apos;s NFT balance must compare to the threshold.
          </FormHelperText>
        </FormControl>

        <Field name="nftBalanceThreshold">
          {({ field, form }: FieldProps) => (
            <FormControl>
              <FormLabel>NFT balance threshold</FormLabel>
              <NumberInput
                min={0}
                step={1}
                value={field.value ?? ""}
                onChange={(value) =>
                  form.setFieldValue("nftBalanceThreshold", value)
                }
              >
                <NumberInputField />
              </NumberInput>
              <FormHelperText>
                Number of NFTs the recipient must hold from the collection to
                claim.
              </FormHelperText>
            </FormControl>
          )}
        </Field>

        <DateTimeLocalField
          fieldName="expirationDate"
          label="Expiration date"
          helperText="Required. After this date, only the sender can recover funds."
        />
      </Stack>
    </Flex>
  );
}
