const STORAGE_KEY = "just:dismissed-notices";

/**
 * Store externe minimal au-dessus de `localStorage`, lu via
 * `useSyncExternalStore` : l'état n'existe pas au rendu serveur et ne doit donc
 * pas être lu pendant le rendu.
 */
let snapshot: readonly string[] | null = null;

const EMPTY: readonly string[] = [];

const listeners = new Set<() => void>();

function available(): boolean {
  return typeof window !== "undefined";
}

function load(): readonly string[] {
  if (!available()) return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getDismissed(): readonly string[] {
  snapshot ??= load();
  return snapshot;
}

/**
 * `null` — et non la liste vide — parce que le serveur ne sait pas ce qui a été
 * rejeté : il ne peut pas conclure « rien ». Renvoyer `EMPTY` faisait rendre
 * l'avis *ouvert* dans le HTML, donc un modal et son verrou de pointeur posés
 * sur une page qui, une fois hydratée, n'avait aucun avis à montrer : plus rien
 * n'était cliquable jusqu'à la navigation suivante.
 *
 * React réutilise cet instantané pour le premier rendu client, le temps de
 * l'hydratation : l'avis n'apparaît donc qu'ensuite, quand la réponse est
 * connue.
 */
export function getServerDismissed(): readonly string[] | null {
  return null;
}

export function subscribeDismissed(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDismissedSnapshot(): readonly string[] {
  return getDismissed();
}

export function dismissNotice(id: string): void {
  if (getDismissed().includes(id)) return;

  snapshot = [...getDismissed(), id];
  if (available()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Stockage refusé : l'avis réapparaîtra à la prochaine visite.
    }
  }
  for (const listener of listeners) listener();
}
