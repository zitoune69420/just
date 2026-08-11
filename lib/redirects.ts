/**
 * Chemin de retour accepté après connexion.
 *
 * Une simple vérification « commence par `/` » ne suffit pas : les navigateurs
 * normalisent `\` en `/`, donc `/\evil.com` part vers `//evil.com`, c'est-à-dire
 * un autre domaine. On refuse aussi les caractères de contrôle, qui permettent
 * de couper l'analyse de l'URL.
 */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length > 512) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;

  try {
    // Rejette tout ce qui se laisse relire comme une URL absolue.
    const url = new URL(value, "https://internal.invalid");
    if (url.origin !== "https://internal.invalid") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function safeInternalPathOr(
  value: string | null | undefined,
  fallback: string,
): string {
  return safeInternalPath(value) ?? fallback;
}
