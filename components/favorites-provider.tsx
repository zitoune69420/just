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
  FAVORITES_ENDPOINT,
  favoriteKey,
  type FavoritesPayload,
} from "@/lib/favorites";
import { toggleFavorite } from "@/lib/favorites-actions";
import type { MediaType } from "@/lib/types";

interface FavoritesValue {
  ready: boolean;
  has: (mediaType: MediaType, tmdbId: number) => boolean;
  isBusy: (mediaType: MediaType, tmdbId: number) => boolean;
  toggle: (mediaType: MediaType, tmdbId: number) => void;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

function withKey(keys: ReadonlySet<string>, key: string, present: boolean) {
  const next = new Set(keys);
  if (present) {
    next.add(key);
  } else {
    next.delete(key);
  }
  return next;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [keys, setKeys] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set<string>());

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(FAVORITES_ENDPOINT, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as FavoritesPayload;
        setSignedIn(data.signedIn);
        setKeys(new Set(data.keys));
        setReady(true);
      } catch {
        return;
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const has = useCallback(
    (mediaType: MediaType, tmdbId: number) =>
      keys.has(favoriteKey(mediaType, tmdbId)),
    [keys],
  );

  const isBusy = useCallback(
    (mediaType: MediaType, tmdbId: number) =>
      busy.has(favoriteKey(mediaType, tmdbId)),
    [busy],
  );

  const toggle = useCallback(
    (mediaType: MediaType, tmdbId: number) => {
      const key = favoriteKey(mediaType, tmdbId);

      if (ready && !signedIn) {
        const returnTo = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        router.push(`/login?returnTo=${returnTo}`);
        return;
      }

      if (busy.has(key)) return;

      const next = !keys.has(key);
      setKeys((current) => withKey(current, key, next));
      setBusy((current) => withKey(current, key, true));

      void toggleFavorite(mediaType, tmdbId, next)
        .then((result) => {
          if (result.ok) {
            router.refresh();
            return;
          }
          setKeys((current) => withKey(current, key, !next));
          if (result.reason === "unauthenticated") {
            const returnTo = encodeURIComponent(
              window.location.pathname + window.location.search,
            );
            router.push(`/login?returnTo=${returnTo}`);
          }
        })
        .catch(() => {
          setKeys((current) => withKey(current, key, !next));
        })
        .finally(() => {
          setBusy((current) => withKey(current, key, false));
        });
    },
    [busy, keys, ready, router, signedIn],
  );

  const value = useMemo(
    () => ({ ready, has, isBusy, toggle }),
    [has, isBusy, ready, toggle],
  );

  return (
    <FavoritesContext value={value}>{children}</FavoritesContext>
  );
}

export function useFavorites(): FavoritesValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites doit être utilisé dans <FavoritesProvider>.");
  }
  return context;
}
