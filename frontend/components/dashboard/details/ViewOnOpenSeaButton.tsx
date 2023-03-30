import { Button, Image } from "@chakra-ui/react";

const OPENSEA_URL =
  "https://testnets.opensea.io/assets/mumbai/0x50d535af78a154a493d6ed466b363ddebe4ee88f/";

interface ViewOnOpenSeaButtonProps {
  id: string;
}

const ViewOnOpenSeaButton = ({ id }: ViewOnOpenSeaButtonProps) => {
  return (
    <Button
      as="a"
      size="sm"
      colorScheme="blue"
      href={OPENSEA_URL + id}
      target="_blank"
      rel="noopener noreferrer"
      leftIcon={
        <Image
          src="/logos/opensea-logo.svg"
          alt="OpenSea Logo"
          boxSize="20px"
        />
      }
    >
      View on OpenSea
    </Button>
  );
};

export default ViewOnOpenSeaButton;
