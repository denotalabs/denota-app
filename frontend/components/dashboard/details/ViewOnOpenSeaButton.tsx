import { Button, Image } from "@chakra-ui/react";

const OPENSEA_URL = "https://opensea.io/assets/";

interface ViewOnOpenSeaButtonProps {
  id: string;
  chain?: string;
  registrarAddress: string;
}

const ViewOnOpenSeaButton = ({
  id,
  registrarAddress,
  chain = "matic",
}: ViewOnOpenSeaButtonProps) => {
  const url = `${OPENSEA_URL}${chain}/${registrarAddress}/${id}`;
  return (
    <Button
      as="a"
      size="sm"
      colorScheme="blue"
      href={url}
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
