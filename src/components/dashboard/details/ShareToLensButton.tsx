import { Button, Image } from "@chakra-ui/react";

interface ShareToLensButtonProps {
  text: string;
  url: string;
  via?: string;
}

const ShareToLensButton = ({
  text,
  url,
  via,
}: ShareToLensButtonProps): JSX.Element => {
  const lensUrl = `https://lenster.xyz/?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}${
    via ? `&via=${encodeURIComponent(via)}` : ""
  }&hashtags=lens,web3`;

  const handleClick = () => {
    window.open(lensUrl, "_blank");
  };

  return (
    <Button
      onClick={handleClick}
      colorScheme="green"
      leftIcon={
        <Image src="/logos/lens-logo.svg" alt="Lens Logo" boxSize="30px" />
      }
    >
      Share to Lens
    </Button>
  );
};

export default ShareToLensButton;
