import { Box, Radio, RadioGroup, Stack } from "@chakra-ui/react";

function CurrencySelector() {
  return (
    <Box borderRadius={10} padding={6} bg="gray.700" w="100%">
      <RadioGroup>
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
