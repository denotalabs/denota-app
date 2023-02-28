import { Flex } from "@chakra-ui/react";

import ToggleColor from "./ToggleColor";
import WalletInfo from "./WalletInfo";
import ChainSwitcher from "./ChainSwitcher";

const DesktopHeader = () => {
  const chains = [
    {
      name: "Polygon Mumbai",
      chainId: "0x13881",
      logoSrc: "/images/polygon-logo.png",
    },
    {
      name: "Celo Alfajores",
      chainId: "0xa4ec",
      logoSrc: "/images/celo-logo.png",
      isDisabled: true,
    },
    {
      name: "Ethereum",
      chainId: "0x1",
      logoSrc: "/images/ethereum-logo.png",
      isDisabled: true,
    },
  ];
  return (
    <Flex
      px={8}
      py={4}
      as="nav"
      align="center"
      justify="flex-end"
      w="100%"
      gap={10}
    >
      <ChainSwitcher chains={chains} />
      <WalletInfo />
      <ToggleColor />
    </Flex>
  );
};

export default DesktopHeader;
