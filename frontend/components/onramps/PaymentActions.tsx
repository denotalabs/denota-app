import { Button, ButtonGroup, useDisclosure } from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useState } from "react";
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
  const [approveLoading, setApproveLoading] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  switch (status) {
    case "Withdrawn":
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
    case "Requested":
      return (
        <Button
          bg="brand.300"
          color="brand.200"
          fontSize={style === "big" ? "2xl" : "md"}
          w={style === "big" ? "min(40vw, 200px)" : "min(40vw, 100px)"}
          borderRadius={5}
          isLoading={approveLoading}
          onClick={async () => {
            setApproveLoading(true);
            await wait(3000);
            Cookies.set(`payments-${paymentId}`, "approved");
            setApproveLoading(false);
          }}
        >
          Approve
        </Button>
      );
  }
}
