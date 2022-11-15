import { Box, FormLabel, Radio, RadioGroup, Stack } from "@chakra-ui/react";

function CurrencySelector() {
  return (
    <Box borderRadius={10} padding={4} mb={6} bg="gray.700" w="100%">
      <RadioGroup>
        <FormLabel mb={2}>Select Asset</FormLabel>

        <Stack spacing={4} direction="row">
          {["ETH", "WBTC", "USDC"].map((value) => (
            <div key={value}>
              <Radio value={value}>{value}</Radio>
            </div>
          ))}
        </Stack>
      </RadioGroup>
    </Box>
  );
}

export default CurrencySelector;
