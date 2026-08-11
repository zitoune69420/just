import { headers } from "next/headers";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase";

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
 * Compteur partagé par tout le déploiement. Les scopes sensibles (connexion,
 * inscription, réinitialisation) passent par là : le compteur en mémoire ne
 * vaut que pour une instance, donc la limite réelle serait multipliée par le
 * nombre de processus et remise à zéro à chaque redémarrage.
 *
 * Sans base, ou si la base répond mal, on retombe sur le compteur local : mieux
 * vaut une limite approximative qu'aucune limite.
 */
export async function consumeShared(
  key: string,
  quota: Quota,
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return consume(key, quota);

  try {
    const { data, error } = await supabaseAdmin().rpc("consume_rate_limit", {
      p_key: key,
      p_limit: quota.limit,
      p_window_ms: quota.windowMs,
    });

    if (error || typeof data !== "boolean") {
      throw error ?? new Error("réponse inattendue");
    }
    return data;
  } catch (error) {
    console.error("[rate-limit] Compteur partagé indisponible", error);
    return consume(key, quota);
  }
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

/** Limite par IP, comptée dans le store partagé (voir `consumeShared`). */
export async function allowByIpShared(
  scope: string,
  quota: Quota,
): Promise<boolean> {
  return consumeShared(`${scope}:${await clientIp()}`, quota);
}

/** Limite par compte connecté, pour brider un abus qui change d'adresse. */
export function allowByUser(
  scope: string,
  userId: string,
  quota: Quota,
): boolean {
  return consume(`${scope}:user:${userId}`, quota);
}

/**
 * Limite par IP *et* par identifiant visé (email, compte…). Toujours comptée
 * dans le store partagé : c'est le rempart contre le bruteforce.
 */
export async function allowByIpAndSubject(
  scope: string,
  subject: string,
  quota: Quota,
): Promise<boolean> {
  const ip = await clientIp();
  /** Les deux compteurs sont consommés, même si le premier refuse déjà. */
  const [perIp, perSubject] = await Promise.all([
    consumeShared(`${scope}:ip:${ip}`, quota),
    consumeShared(`${scope}:subject:${subject.toLowerCase()}`, quota),
  ]);
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
