import { Button, ButtonGroup, useDisclosure } from "@chakra-ui/react";
import RecoveryModal from "./RecoveryModal";

export function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

interface ActionsProp {
  status: string;
  paymentId: string;
  style: "big" | "small";
}

export function PaymentActions({ status, paymentId, style }: ActionsProp) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  switch (status) {
    case "Covered":
      return (
        <>
          <RecoveryModal
            isOpen={isOpen}
            onClose={onClose}
            onchainId={paymentId}
          />
          <ButtonGroup>
            <Button
              bg="brand.300"
              color="brand.200"
              fontSize={style === "big" ? "2xl" : "md"}
              w={style === "big" ? "min(40vw, 200px)" : "min(40vw, 100px)"}
              borderRadius={5}
              onClick={async () => {
                onOpen();
              }}
            >
              Recover
            </Button>
          </ButtonGroup>
        </>
      );
  }
}
