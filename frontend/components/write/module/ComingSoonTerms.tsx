import {
  Alert,
  AlertDescription,
  AlertIcon,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import InfoTooltip from "../../designSystem/InfoTooltip";
import { ComingSoonModule } from "../../../utils/comingSoonModules";

interface Props {
  module: ComingSoonModule;
}

export function ComingSoonTerms({ module }: Props) {
  return (
    <Flex flexWrap="wrap" direction="column" gap="18px">
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          {module.title} is coming soon. Preview the configuration fields below —
          they are not yet available.
        </AlertDescription>
      </Alert>

      <Stack spacing={5}>
        {module.fields.map((field) => (
          <FormControl key={field.label} isDisabled>
            <FormLabel noOfLines={1} flexShrink={0}>
              {field.label}
              {field.tooltip ? <InfoTooltip label={field.tooltip} /> : null}
            </FormLabel>
            <Input placeholder={field.placeholder} />
          </FormControl>
        ))}
      </Stack>
    </Flex>
  );
}
