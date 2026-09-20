import type { NextApiRequest, NextApiResponse } from "next";
import { classifyAccountInput } from "../../../utils/accountIdentity";
import { lookupPrivyWalletServer } from "../../../utils/privyServer";

type ResponseBody = { address: string | null } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const value = req.body?.value;
  if (typeof value !== "string") {
    return res.status(400).json({ error: "value must be a string" });
  }

  const kind = classifyAccountInput(value);
  if (kind !== "email" && kind !== "phone") {
    return res.status(400).json({ error: "value must be an email or phone" });
  }

  try {
    const address = await lookupPrivyWalletServer(value);
    return res.status(200).json({ address });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("not configured") ||
      message.includes("unauthorized")
    ) {
      return res.status(503).json({ error: "Privy lookup is not available" });
    }
    return res.status(500).json({ error: "Failed to look up wallet" });
  }
}
