import CheqCard from "./CheqCard";
import { DaiAddress } from "../context/BlockchainDataProvider";
import { useTokens } from "../hooks/useTokens";
import { ethers } from "ethers";
import { Skeleton, Stack } from "@chakra-ui/react";

function VoidTab() {
  const tokenData = useTokens("tokensAuditing", false);

  if (tokenData) {
    const cheqs = tokenData.map((token: any, index: number) => {
      const cheqId = parseInt(token.id, 16);
      const status =
        token.status == "0"
          ? "Pending"
          : token.status == "1"
          ? "Cashed"
          : "Voided";
      const tokenName =
        token.ercToken.id === DaiAddress.toLocaleLowerCase() ? "DAI" : "WETH";

      const amount = ethers.utils
        .formatEther(token.amount.toString())
        .toString();
      const sender = token.drawer.id.slice(0, 10) + "...";
      const auditor = token.auditor.id.slice(0, 10) + "...";

      const timeCreated = new Date(token.createdAt * 1000);
      const created = timeCreated.toLocaleString("en-US", {
        timeZone: "UTC",
      });
      const timeExpires = new Date(token.expiry * 1000);
      const expiration = timeExpires.toLocaleString("en-US", {
        timeZone: "UTC",
      });
      const isCashable = Date.now() >= token.expiry * 1000;
      return (
        <CheqCard
          key={index.toString()}
          cheqId={cheqId}
          status={status}
          token={tokenName}
          amount={amount}
          sender={sender}
          auditor={auditor}
          created={created}
          expiry={expiration}
          isCashable={isCashable}
          isUser={false}
        />
      );
    });

    return (
      <div>
        You have {tokenData.length} cheq(s):
        <br></br>
        <br></br>
        {cheqs}
      </div>
    );
  } else {
    return (
      <>
        <Stack>
          <Skeleton height="80px" />
        </Stack>
      </>
    );
  }
}

export default VoidTab;
