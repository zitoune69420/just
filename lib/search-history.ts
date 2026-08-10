const STORAGE_KEY = "just:recent-searches";

const MAX_ENTRIES = 6;

const MAX_LENGTH = 100;

const EMPTY: string[] = [];

/**
 * Petit store externe autour de `localStorage`, consommé côté composant via
 * `useSyncExternalStore` : l'historique n'existe pas au rendu serveur et ne
 * doit donc pas être lu pendant le rendu.
 */
let snapshot: string[] | null = null;

const listeners = new Set<() => void>();

function available(): boolean {
  return typeof window !== "undefined";
}

function load(): string[] {
  if (!available()) return EMPTY;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (!raw) return EMPTY;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .filter((term): term is string => typeof term === "string")
      .slice(0, MAX_ENTRIES);
  } catch {
    return EMPTY;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function commit(terms: string[]): void {
  snapshot = terms;
  if (available()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
    } catch {
      // Stockage plein ou refusé : l'historique vit le temps de la session.
    }
  }
  emit();
}

export function getSearchHistory(): string[] {
  snapshot ??= load();
  return snapshot;
}

/** Snapshot serveur : constant, sinon le rendu diverge de l'hydratation. */
export function getServerSearchHistory(): string[] {
  return EMPTY;
}

export function subscribeSearchHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function rememberSearch(term: string): void {
  const value = term.trim().slice(0, MAX_LENGTH);
  if (value.length < 2) return;

  const lower = value.toLowerCase();
  const rest = getSearchHistory().filter(
    (entry) => entry.toLowerCase() !== lower,
  );
  commit([value, ...rest].slice(0, MAX_ENTRIES));
}

export function forgetSearch(term: string): void {
  commit(getSearchHistory().filter((entry) => entry !== term));
}

export function clearSearchHistory(): void {
  commit([]);
}
