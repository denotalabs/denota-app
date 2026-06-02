import type { NextApiRequest, NextApiResponse } from "next";
import { lookupEnsAddressesServer } from "../../../utils/ensServer";

const MAX_NAMES = 10;

type ResponseBody =
  | { addresses: Record<string, string | null> }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const names = req.body?.names;
  if (!Array.isArray(names) || names.some((name) => typeof name !== "string")) {
    return res.status(400).json({ error: "names must be a string array" });
  }

  const limited = names.slice(0, MAX_NAMES);
  const addresses = await lookupEnsAddressesServer(limited);
  return res.status(200).json({ addresses });
}
