import type { NextApiRequest, NextApiResponse } from "next";
import { lookupEnsNamesServer } from "../../../utils/ensServer";

const MAX_ADDRESSES = 50;

type ResponseBody =
  | { names: Record<string, string | null> }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const addresses = req.body?.addresses;
  if (!Array.isArray(addresses) || addresses.some((a) => typeof a !== "string")) {
    return res.status(400).json({ error: "addresses must be a string array" });
  }

  const limited = addresses.slice(0, MAX_ADDRESSES);
  const names = await lookupEnsNamesServer(limited);
  return res.status(200).json({ names });
}
