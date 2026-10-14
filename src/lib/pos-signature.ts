import "server-only";

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

export async function decryptPosSecret(encryptedSecret: string, iv: string) {
  const masterValue = process.env.POS_CREDENTIAL_ENCRYPTION_KEY;
  if (!masterValue) throw new Error("POS_CREDENTIAL_ENCRYPTION_KEY is not configured.");
  const master = fromBase64(masterValue);
  if (master.length !== 32) throw new Error("POS_CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes.");
  const key = await crypto.subtle.importKey("raw", master, "AES-GCM", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(encryptedSecret),
  );
  return new Uint8Array(decrypted);
}

export async function verifyPosSignature(canonical: string, signature: string, secret: Uint8Array) {
  let provided: Uint8Array;
  try {
    provided = fromBase64(signature);
  } catch {
    return false;
  }
  const rawSecret = new Uint8Array(secret.byteLength);
  rawSecret.set(secret);
  const key = await crypto.subtle.importKey("raw", rawSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical)));
  return equalBytes(expected, provided);
}
