import { CompactEncrypt, compactDecrypt } from "jose";

async function encryptionKey(): Promise<Uint8Array> {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("Server is missing required configuration");
  }

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return new Uint8Array(digest);
}

export async function seal(payload: unknown): Promise<string> {
  const key = await encryptionKey();
  return new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(key);
}

export async function unseal<T>(token: string): Promise<T | null> {
  try {
    const key = await encryptionKey();
    const { plaintext } = await compactDecrypt(token, key);
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    return null;
  }
}
