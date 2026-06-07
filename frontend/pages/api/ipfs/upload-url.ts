import type { NextApiRequest, NextApiResponse } from "next";
import { createPinataSignedUploadUrl } from "../../../utils/pinataServer";

type ResponseBody = { url: string } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const mimeType =
    typeof req.body?.mimeType === "string" ? req.body.mimeType : undefined;

  try {
    const url = await createPinataSignedUploadUrl({ mimeType });
    return res.status(200).json({ url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create upload URL" });
  }
}
