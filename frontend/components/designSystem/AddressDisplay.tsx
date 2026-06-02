import { Text, TextProps } from "@chakra-ui/react";
import { isAddress } from "ethers/lib/utils";
import { FormatAddressOptions } from "../../hooks/useFormatAddress";
import { useDisplayAddress } from "../../hooks/useDisplayAddress";

interface AddressDisplayProps extends TextProps {
  address: string;
  shorten?: boolean;
  ensNames?: Map<string, string | null>;
}

function AddressDisplay({
  address,
  shorten = true,
  ensNames,
  title,
  ...textProps
}: AddressDisplayProps) {
  const options: FormatAddressOptions = { shorten };
  const display = useDisplayAddress(address, options, ensNames);
  const tooltip = title ?? (isAddress(address) ? address : undefined);

  return (
    <Text
      title={tooltip}
      noOfLines={shorten ? 1 : undefined}
      wordBreak={shorten ? undefined : "break-all"}
      {...textProps}
    >
      {display}
    </Text>
  );
}

export default AddressDisplay;
