import { headers } from "next/headers";

/**
 * Compteur en mémoire, fenêtre fixe. Suffisant pour freiner le bruteforce et
 * l'abus d'API sur une instance ; en déploiement multi-instances chaque
 * processus a son propre compteur, donc la limite réelle est multipliée par le
 * nombre d'instances. Pour une garantie stricte il faudra un store partagé.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 20_000;

export interface Quota {
  limit: number;
  windowMs: number;
}

export const MINUTE = 60_000;

export const HOUR = 60 * MINUTE;

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** `false` quand le quota est dépassé. Consomme un jeton sinon. */
export function consume(key: string, quota: Quota): boolean {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + quota.windowMs });
    return true;
  }

  if (bucket.count >= quota.limit) return false;

  bucket.count += 1;
  return true;
}

/**
 * Adresse de l'appelant. Derrière un proxy de confiance (Vercel), le premier
 * maillon de `x-forwarded-for` est l'IP cliente.
 */
export async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return store.get("x-real-ip") ?? "unknown";
}

/** Limite par IP pour un `scope` donné. `false` quand la limite est atteinte. */
export async function allowByIp(
  scope: string,
  quota: Quota,
): Promise<boolean> {
  return consume(`${scope}:${await clientIp()}`, quota);
}

/** Limite par IP *et* par identifiant visé (email, compte…). */
export async function allowByIpAndSubject(
  scope: string,
  subject: string,
  quota: Quota,
): Promise<boolean> {
  const ip = await clientIp();
  const perIp = consume(`${scope}:ip:${ip}`, quota);
  const perSubject = consume(
    `${scope}:subject:${subject.toLowerCase()}`,
    quota,
  );
  return perIp && perSubject;
}

export function tooManyRequests(retryAfterMs: number): Response {
  return new Response(null, {
    status: 429,
    headers: {
      "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
      "Cache-Control": "no-store",
    },
  });
}
