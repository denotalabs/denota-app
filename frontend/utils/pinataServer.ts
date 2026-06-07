export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function createPinataSignedUploadUrl(options?: {
  mimeType?: string;
}): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("PINATA_JWT is not configured");
  }

  const body: Record<string, unknown> = {
    network: "public",
    expires: 60,
    date: Math.floor(Date.now() / 1000),
    max_file_size: MAX_UPLOAD_BYTES,
  };

  if (options?.mimeType) {
    body.allow_mime_types = [options.mimeType];
  }

  const resp = await fetch("https://uploads.pinata.cloud/v3/files/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Pinata sign failed (${resp.status}): ${text}`);
  }

  const json = (await resp.json()) as { data?: string };
  if (typeof json.data !== "string" || !json.data) {
    throw new Error("Invalid Pinata signed URL response");
  }

  return json.data;
}
