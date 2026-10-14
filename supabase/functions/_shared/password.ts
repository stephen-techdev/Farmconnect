// Password hashing helpers for FarmConnect edge functions.
//
// Uses PBKDF2-HMAC-SHA256 from the Web Crypto API (built into Deno, no external
// dependencies). Stored format:  pbkdf2$<iterations>$<saltHex>$<hashHex>
//
// Backwards compatible: legacy accounts that still store a plaintext password
// verify against the plaintext value, so existing logins keep working. Callers
// should re-hash (upgrade) the stored value after a successful legacy login.

const ITERATIONS = 100_000;
const KEY_LEN_BITS = 256;
const PREFIX = "pbkdf2";

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    KEY_LEN_BITS,
  );
  return toHex(bits);
}

/** True if the stored value is already a PBKDF2 hash (not legacy plaintext). */
export function isHashed(stored: string | null | undefined): boolean {
  return typeof stored === "string" && stored.startsWith(PREFIX + "$");
}

/** Hash a plaintext password into the stored representation. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toHex(salt)}$${hash}`;
}

/**
 * Verify a plaintext password against a stored value.
 * Handles both hashed and legacy plaintext storage.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (!isHashed(stored)) {
    // Legacy plaintext account.
    return timingSafeEqual(password, stored);
  }
  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  const [, iterStr, saltHex, hashHex] = parts;
  const iterations = parseInt(iterStr, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  if (!saltHex || !hashHex) return false;
  const computed = await derive(password, fromHex(saltHex), iterations);
  return timingSafeEqual(computed, hashHex);
}