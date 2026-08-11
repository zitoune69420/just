import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

/**
 * Paramètres recommandés par l'OWASP (variante `N=2^16, r=8, p=2`, équivalente
 * en coût à `N=2^17, r=8, p=1` mais deux fois moins gourmande en mémoire).
 * Ils sont écrits dans le hash : les anciens condensats restent vérifiables et
 * sont ré-encodés au prochain changement de mot de passe.
 */
const CURRENT: ScryptParams = { N: 65536, r: 8, p: 2 };

/** Paramètres implicites des hashs `scrypt$salt$digest` d'avant ce format. */
const LEGACY: ScryptParams = { N: 16384, r: 8, p: 1 };

/** `scrypt` refuse de tourner si 128 * N * r dépasse `maxmem`. */
const MAX_MEM = 256 * 1024 * 1024;

const KEY_LENGTH = 64;

export const PASSWORD_MIN_LENGTH = 8;

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options: ScryptParams & { maxmem: number },
) => Promise<Buffer>;

function derive(
  password: string,
  salt: string,
  keylen: number,
  params: ScryptParams,
): Promise<Buffer> {
  return scryptAsync(password, salt, keylen, { ...params, maxmem: MAX_MEM });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, KEY_LENGTH, CURRENT);
  return `scrypt$${CURRENT.N}$${CURRENT.r}$${CURRENT.p}$${salt}$${key.toString("hex")}`;
}

interface StoredHash {
  params: ScryptParams;
  salt: string;
  digest: string;
}

function parse(stored: string): StoredHash | null {
  const parts = stored.split("$");

  if (parts[0] !== "scrypt") return null;

  if (parts.length === 3) {
    const [, salt, digest] = parts;
    if (!salt || !digest) return null;
    return { params: LEGACY, salt, digest };
  }

  if (parts.length === 6) {
    const [, n, r, p, salt, digest] = parts;
    const params = { N: Number(n), r: Number(r), p: Number(p) };
    const sane =
      Number.isInteger(params.N) &&
      Number.isInteger(params.r) &&
      Number.isInteger(params.p) &&
      params.N > 1 &&
      params.r > 0 &&
      params.p > 0 &&
      128 * params.N * params.r <= MAX_MEM;
    if (!sane || !salt || !digest) return null;
    return { params, salt, digest };
  }

  return null;
}

export async function verifyPassword(
  password: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false;

  const parsed = parse(stored);
  if (!parsed) return false;

  const expected = Buffer.from(parsed.digest, "hex");
  if (expected.length === 0) return false;

  const key = await derive(
    password,
    parsed.salt,
    expected.length,
    parsed.params,
  );
  return expected.length === key.length && timingSafeEqual(expected, key);
}

/** `true` quand le condensat stocké utilise des paramètres dépassés. */
export function needsRehash(stored: string | null): boolean {
  if (!stored) return false;
  const parsed = parse(stored);
  if (!parsed) return true;
  return (
    parsed.params.N < CURRENT.N ||
    parsed.params.r < CURRENT.r ||
    parsed.params.p < CURRENT.p
  );
}
