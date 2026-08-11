"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  COLLECTIONS_ENDPOINT,
  collectionItemKey,
  type CollectionKind,
  type CollectionsPayload,
} from "@/lib/collections";
import { toggleCollectionItem } from "@/lib/collection-actions";
import type { MediaType } from "@/lib/types";

interface CollectionsValue {
  ready: boolean;
  has: (kind: CollectionKind, mediaType: MediaType, tmdbId: number) => boolean;
  isBusy: (
    kind: CollectionKind,
    mediaType: MediaType,
    tmdbId: number,
  ) => boolean;
  toggle: (kind: CollectionKind, mediaType: MediaType, tmdbId: number) => void;
}

const CollectionsContext = createContext<CollectionsValue | null>(null);

type KeySets = Record<CollectionKind, ReadonlySet<string>>;

function emptySets(): KeySets {
  return { favorite: new Set<string>(), watchlist: new Set<string>() };
}

function withKey(
  sets: KeySets,
  kind: CollectionKind,
  key: string,
  present: boolean,
): KeySets {
  const next = new Set(sets[kind]);
  if (present) {
    next.add(key);
  } else {
    next.delete(key);
  }
  return { ...sets, [kind]: next };
}

/** Une seule clé de verrou par (liste, titre) : les deux listes se togglent en parallèle. */
function busyKey(kind: CollectionKind, key: string): string {
  return `${kind}:${key}`;
}

export function CollectionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [keys, setKeys] = useState<KeySets>(emptySets);
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set<string>());

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(COLLECTIONS_ENDPOINT, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as CollectionsPayload;
        setSignedIn(data.signedIn);
        setKeys({
          favorite: new Set(data.keys.favorite),
          watchlist: new Set(data.keys.watchlist),
        });
        setReady(true);
      } catch {
        return;
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const has = useCallback(
    (kind: CollectionKind, mediaType: MediaType, tmdbId: number) =>
      keys[kind].has(collectionItemKey(mediaType, tmdbId)),
    [keys],
  );

  const isBusy = useCallback(
    (kind: CollectionKind, mediaType: MediaType, tmdbId: number) =>
      busy.has(busyKey(kind, collectionItemKey(mediaType, tmdbId))),
    [busy],
  );

  const toggle = useCallback(
    (kind: CollectionKind, mediaType: MediaType, tmdbId: number) => {
      const key = collectionItemKey(mediaType, tmdbId);
      const lock = busyKey(kind, key);

      function toLogin() {
        const returnTo = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        router.push(`/login?returnTo=${returnTo}`);
      }

      if (ready && !signedIn) {
        toLogin();
        return;
      }

      if (busy.has(lock)) return;

      const next = !keys[kind].has(key);
      setKeys((current) => withKey(current, kind, key, next));
      setBusy((current) => new Set(current).add(lock));

      function release() {
        setBusy((current) => {
          const updated = new Set(current);
          updated.delete(lock);
          return updated;
        });
      }

      void toggleCollectionItem(kind, mediaType, tmdbId, next)
        .then((result) => {
          if (result.ok) {
            router.refresh();
            return;
          }
          setKeys((current) => withKey(current, kind, key, !next));
          if (result.reason === "unauthenticated") toLogin();
        })
        .catch(() => {
          setKeys((current) => withKey(current, kind, key, !next));
        })
        .finally(release);
    },
    [busy, keys, ready, router, signedIn],
  );

  const value = useMemo(
    () => ({ ready, has, isBusy, toggle }),
    [has, isBusy, ready, toggle],
  );

  return (
    <CollectionsContext value={value}>{children}</CollectionsContext>
  );
}

export function useCollections(): CollectionsValue {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error(
      "useCollections doit être utilisé dans <CollectionsProvider>.",
    );
  }
  return context;
}
