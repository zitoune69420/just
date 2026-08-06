import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export const PASSWORD_MIN_LENGTH = 8;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false;

  const [scheme, salt, digest] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !digest) return false;

  const expected = Buffer.from(digest, "hex");
  const key = await derive(password, salt, expected.length);
  return expected.length === key.length && timingSafeEqual(expected, key);
}
