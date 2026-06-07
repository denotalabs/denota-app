import axios from "axios";

export function extractPinataCid(response: unknown): string | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  if (typeof record.cid === "string") {
    return record.cid;
  }

  const data = record.data;
  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (typeof nested.cid === "string") {
      return nested.cid;
    }
    if (typeof nested.IpfsHash === "string") {
      return nested.IpfsHash;
    }
  }

  return undefined;
}

export async function uploadFileToPinata(
  file: File
): Promise<string | undefined> {
  const urlResp = await axios.post<{ url: string }>("/api/ipfs/upload-url/", {
    mimeType: file.type || undefined,
  });

  const signedUrl = urlResp.data.url;
  if (!signedUrl) {
    return undefined;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("network", "public");

  const uploadResp = await fetch(signedUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResp.ok) {
    return undefined;
  }

  const json = await uploadResp.json();
  return extractPinataCid(json);
}
