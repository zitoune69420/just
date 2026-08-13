"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { Dialog, DialogClose, DialogContent } from "@appica/ui-react/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@appica/ui-react/tooltip";
import {
  AlertTriangle,
  PlayerPlayFilled,
  PlayerTrackNext,
  X,
} from "@appica/icons-react";
import {
  fetchSeasonEpisodes,
  nextEpisodeAfter,
  type NextEpisode,
} from "@/lib/next-episode";
import {
  requestPlayback,
  type PlaybackDenied,
} from "@/lib/playback-client";
import { recordProgress } from "@/lib/progress-actions";
import type { MediaType, Season } from "@/lib/types";
import { useTranslations } from "./i18n-provider";
import { AccessDialog } from "./access-dialog";
import { ReportButton } from "./report-button";

export const WATCH_ANCHOR = "regarder";

export interface WatchTrack {
  type: MediaType;
  id: number;
  season: number | null;
  episode: number | null;
  runtime: number | null;
}

export interface NextUp {
  label: string;
  onPlay: () => void;
  pending?: boolean;
}

const TICK_MS = 60_000;

const MIN_FLUSH_SECONDS = 10;

/** Dernier état connu du lecteur, ou `null` tant qu'il n'a rien émis. */
interface PlayerState {
  positionSeconds: number;
  durationSeconds: number | null;
}

interface PlayerEventData {
  player_status?: unknown;
  player_progress?: unknown;
  player_duration?: unknown;
}

function readPlayerEvent(data: unknown): PlayerState | null {
  if (typeof data !== "object" || data === null) return null;

  const message = data as { type?: unknown; data?: unknown };
  if (message.type !== "PLAYER_EVENT") return null;

  const payload = message.data as PlayerEventData | undefined;
  const progress = payload?.player_progress;
  if (typeof progress !== "number" || !Number.isFinite(progress)) return null;

  const duration = payload?.player_duration;

  return {
    positionSeconds: Math.max(Math.round(progress), 0),
    durationSeconds:
      typeof duration === "number" && Number.isFinite(duration) && duration > 0
        ? Math.round(duration)
        : null,
  };
}

/**
 * Position réelle du lecteur, qu'il diffuse par `postMessage` toutes les cinq
 * secondes environ, et à chaque pause ou déplacement dans la vidéo.
 *
 * L'origine du lecteur n'est pas connue du client — c'est tout l'intérêt du
 * détour par `/api/stream` — donc elle ne peut pas servir de filtre. On vérifie
 * à la place que le message vient bien de notre iframe, ce qui est une garantie
 * plus forte : une autre fenêtre ne peut pas se faire passer pour elle.
 */
function usePlayerPosition(
  open: boolean,
  frame: React.RefObject<HTMLIFrameElement | null>,
): React.RefObject<PlayerState | null> {
  const state = useRef<PlayerState | null>(null);

  useEffect(() => {
    if (!open) return;

    function onMessage(event: MessageEvent) {
      if (!frame.current || event.source !== frame.current.contentWindow) {
        return;
      }
      const next = readPlayerEvent(event.data);
      if (next) state.current = next;
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open, frame]);

  return state;
}

function useWatchTimer(
  open: boolean,
  track: WatchTrack | undefined,
  player: React.RefObject<PlayerState | null>,
) {
  const type = track?.type;
  const id = track?.id;
  const season = track?.season ?? null;
  const episode = track?.episode ?? null;
  const runtime = track?.runtime ?? null;

  useEffect(() => {
    if (!open || !type || !id) return;

    let pending = 0;
    let since: number | null =
      document.visibilityState === "visible" ? Date.now() : null;

    function collect() {
      if (since === null) return;
      pending += Date.now() - since;
      since = Date.now();
    }

    function send(beacon: boolean) {
      collect();
      const seconds = Math.round(pending / 1000);
      const state = player.current;

      /**
       * Le seuil ne protège que le comptage à l'aveugle, dont les petites
       * miettes ne valent pas un appel. Une position connue est envoyée quoi
       * qu'il arrive : elle remplace la valeur stockée au lieu de s'y ajouter,
       * et c'est justement la fermeture rapide après un déplacement dans la
       * vidéo qu'il ne faut pas perdre.
       */
      if (state === null && seconds < MIN_FLUSH_SECONDS) return;
      pending = 0;

      const payload = JSON.stringify({
        mediaType: type,
        tmdbId: id,
        season,
        episode,
        seconds,
        positionSeconds: state?.positionSeconds ?? null,
        durationSeconds:
          state?.durationSeconds ?? (runtime !== null ? runtime * 60 : null),
      });

      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/progress",
          new Blob([payload], { type: "application/json" }),
        );
        return;
      }

      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        since = Date.now();
        return;
      }
      send(true);
      since = null;
    }

    function onPageHide() {
      send(true);
    }

    const interval = setInterval(() => send(false), TICK_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      send(true);
    };
  }, [open, type, id, season, episode, runtime, player]);
}

/** Durée d'affichage de l'avertissement publicitaire avant effacement. */
const HINT_MS = 12_000;

export function WatchDialog({
  src,
  open,
  onOpenChange,
  track,
  next,
}: {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: WatchTrack;
  next?: NextUp | null;
}) {
  const t = useTranslations();
  const frame = useRef<HTMLIFrameElement>(null);
  const player = usePlayerPosition(open, frame);
  useWatchTimer(open, track, player);

  /**
   * Le lecteur ouvre deux onglets publicitaires aux premiers clics et rien de
   * notre côté ne peut les empêcher : ils sont ouverts par une page tierce, ce
   * ne sont pas des éléments de notre document. Prévenir est donc tout ce qui
   * reste — et l'avertissement doit reparaître à chaque ouverture, puisque la
   * gêne se reproduit à chaque ouverture. Le composant n'étant monté que
   * pendant la lecture, l'état initial suffit à le faire reparaître.
   */
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setHint(false), HINT_MS);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Position du bord haut du lecteur, pour poser l'avertissement juste dessus.
   *
   * Elle se mesure au lieu de se déduire : le dialogue est centré et sa hauteur
   * dépend du format de la vidéo, du rail et de la fenêtre. Aucune valeur écrite
   * en dur ne suivrait un changement de taille ou une rotation d'écran.
   */
  const [anchorTop, setAnchorTop] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !hint) return;

    const popup = document.querySelector<HTMLElement>("[data-player-popup]");
    if (!popup) return;

    const update = () => setAnchorTop(popup.getBoundingClientRect().top);

    /** Après la peinture : à l'ouverture, le dialogue est encore à sa taille d'entrée. */
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(popup);
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open, hint]);

  return (
    <>
    {/**
     * L'avertissement sort du dialogue par un portail vers `document.body`.
     * Le laisser à l'intérieur ne suffisait pas à le rendre flottant : la
     * popup porte `transform-gpu`, qui fait d'elle le bloc conteneur de tout
     * descendant `fixed`, lequel se retrouve alors rogné par son
     * `overflow-hidden`. Hors du dialogue, il se cale sur la fenêtre.
     *
     * `top` vaut le bord haut du lecteur, mesuré ; la translation de `100%`
     * remonte l'avertissement de sa propre hauteur, plus 0.75rem d'écart. Il
     * suit donc le lecteur au lieu d'être collé en haut de l'écran.
     *
     * `z-60` passe devant le voile du dialogue, posé à `z-50`.
     */}
    {open && hint && anchorTop !== null && typeof document !== "undefined" &&
      createPortal(
        <div
          role="status"
          style={{ top: anchorTop }}
          className="pointer-events-none fixed inset-x-0 z-60 flex -translate-y-[calc(100%+0.75rem)] justify-center px-4"
        >
          <div className="pointer-events-auto flex max-w-lg items-start gap-2.5 rounded-md bg-warning px-4 py-3 text-sm font-medium text-warning-foreground shadow-2xl ring-1 ring-black/10">
            <AlertTriangle size={18} className="mt-px shrink-0" />
            <p className="min-w-0 flex-1">{t("detail.adsWarning")}</p>
            <button
              type="button"
              onClick={() => setHint(false)}
              aria-label={t("detail.adsWarningDismiss")}
              className="-me-1 -mt-1 shrink-0 rounded-sm p-1 text-warning-foreground/70 outline-none transition-colors hover:text-warning-foreground focus-visible:ring-2 focus-visible:ring-warning-foreground"
            >
              <X size={16} />
            </button>
          </div>
        </div>,
        document.body,
      )}
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/**
       * La borne de largeur réserve la place du rail : la vidéo garde son 16/9
       * et doit tenir dans la hauteur visible, donc le rail s'ajoute par-dessus
       * ce calcul au lieu de rogner l'image. Sous `sm` le rail passe dessous,
       * où il ne dispute plus rien à la largeur.
       */}
      {/**
       * `closeButton={false}` : la croix par défaut est en position absolue
       * dans le coin supérieur droit, hors du rail. Elle flottait donc seule
       * au-dessus de la vidéo, à distance des deux autres commandes. Elle est
       * reprise plus bas comme premier élément du rail, avec eux.
       */}
      <DialogContent closeButton={false} data-player-popup="" className="w-full max-w-[min(64rem,calc((100dvh-2rem)*16/9))] overflow-hidden border-border-overlay bg-background p-0 sm:max-w-[min(64rem,calc((100dvh-2rem)*16/9+3.5rem))] [&>[data-slot=dialog-content]]:pt-0! [&>[data-slot=dialog-content]]:pb-0!">
        <div className="relative flex min-h-0 flex-col sm:flex-row">
        <div className="relative aspect-video min-w-0 flex-1">
          {/**
           * Pas d'attribut `sandbox` : mesuré, le lecteur refuse de démarrer dès
           * qu'il en détecte un, même réduit aux droits qu'une page de lecture
           * utilise vraiment. Le blocage n'était donc pas seulement l'ancien
           * `X-Frame-Options` de `/api/stream`, corrigé par ailleurs.
           *
           * Le prix payé est connu : le lecteur est financé par la publicité et
           * ouvre des onglets parasites au clic. Seul `sandbox` peut les
           * refuser, et il coûte la lecture — arbitrage assumé en faveur de la
           * lecture, à rejuger si la source change.
           *
           * Ce qui protège encore : l'iframe reste sur son origine à elle, donc
           * hors de portée de nos cookies (`SameSite`, `HttpOnly`) ; la
           * `Permissions-Policy` de l'app coupe caméra, micro et géoloc ; et
           * `referrerPolicy="no-referrer"` empêche la fuite de l'URL de la fiche.
           */}
          {/**
           * Chaque capacité porte `*` au lieu de son défaut implicite `'src'`.
           * `'src'` désigne l'origine de l'URL écrite dans `src` — ici la nôtre,
           * puisque l'iframe passe par `/api/stream`. Or cette route redirige
           * vers le serveur de flux : le document finalement chargé est sur une
           * autre origine, absente de la liste, et la délégation tombe. Le
           * lecteur se retrouvait avec `document.fullscreenEnabled` à faux, donc
           * un bouton plein écran sans effet ni message d'erreur.
           *
           * `*` ne rouvre rien au-delà de cette iframe : la délégation reste
           * bornée par l'en-tête `Permissions-Policy` de l'application, qui
           * refuse toujours caméra, micro et géolocalisation à tout le monde.
           */}
          <iframe
            ref={frame}
            src={src}
            referrerPolicy="no-referrer"
            allow="autoplay *; encrypted-media *; picture-in-picture *; fullscreen *"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
        {/**
         * Rail latéral. Le passage à l'épisode suivant y devient un vrai bouton,
         * lisible sans attendre la fin : il était jusqu'ici coincé dans une
         * barre sous l'image, à côté d'un simple libellé.
         *
         * Le signalement l'accompagne parce que c'est devant le lecteur qu'on
         * découvre qu'un titre ne se lance pas ; le proposer sur la seule fiche
         * obligerait à ressortir du lecteur pour dire qu'il ne marche pas.
         *
         * Il porte les trois commandes, fermeture comprise : une croix flottant
         * seule dans un coin ne se relie visuellement à rien.
         *
         * Sous `sm` le rail devient une barre, et l'ordre vertical du desktop y
         * est rejoué à l'horizontale : fermeture et épisode suivant — en haut de
         * colonne — passent à droite, le signalement — en bas, par `sm:mt-auto`
         * — passe à gauche. Les `order` explicites tiennent cet agencement quel
         * que soit le nombre de boutons présents, et `ms-auto` sépare les deux
         * groupes sans `justify-between`, qui collerait un bouton seul au
         * mauvais bord.
         */}
        {/**
         * Le rembourrage horizontal ne bouge pas sous `sm` : la largeur du rail
         * est fixe (`sm:w-14`) et `px-3` est exactement ce qui y centre un
         * bouton de 2rem. C'est le dégagement vertical qui s'ouvre, puisque
         * c'est lui qui rapproche les boutons des coins.
         */}
        <aside className="flex shrink-0 flex-row items-center gap-3 border-t border-border-overlay bg-background px-4 py-3 sm:w-14 sm:flex-col sm:justify-start sm:gap-4 sm:border-t-0 sm:border-s sm:px-3 sm:py-5">
            {/**
             * `icon-sm` + `rounded-sm` sur les trois : autrement le rail aligne
             * des boîtes de tailles et de rondeurs différentes.
             */}
            <DialogClose
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("playback.close")}
                  className="rounded-sm max-sm:order-3"
                >
                  <X size={16} />
                </Button>
              }
            />

            {next && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="primary"
                      size="icon-sm"
                      aria-label={`${t("detail.nextEpisode")} — ${next.label}`}
                      className="rounded-sm max-sm:order-2 max-sm:ms-auto"
                      onClick={next.onPlay}
                      disabled={next.pending}
                    >
                      <PlayerTrackNext size={16} />
                    </Button>
                  }
                />
                {/** Le numéro d'épisode n'a plus d'autre endroit où s'afficher. */}
                <TooltipContent>
                  {t("detail.nextEpisode")} — {next.label}
                </TooltipContent>
              </Tooltip>
            )}

            {track && (
              <ReportButton
                mediaType={track.type}
                tmdbId={track.id}
                season={track.season}
                episode={track.episode}
                className="max-sm:order-1 sm:mt-auto"
              />
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

export function WatchButton({
  id,
  type,
  season = null,
  episode = null,
  runtime = null,
  seasons = [],
  resumed = false,
  advanced = false,
  available = true,
}: {
  id: number;
  type: MediaType;
  season?: number | null;
  episode?: number | null;
  runtime?: number | null;
  seasons?: Season[];
  resumed?: boolean;
  /** La cible est l'épisode d'après, pas celui laissé en cours : on ne « reprend » pas. */
  advanced?: boolean;
  available?: boolean;
}) {
  const t = useTranslations();
  const [src, setSrc] = useState<string | null>(null);
  const [denied, setDenied] = useState<PlaybackDenied | null>(null);
  const [pending, setPending] = useState(false);
  const [current, setCurrent] = useState({ season, episode, runtime });
  const [next, setNext] = useState<NextEpisode | null>(null);

  async function play(
    nextSeason: number | null,
    nextEpisode: number | null,
    nextRuntime: number | null,
  ) {
    if (pending) return;
    setPending(true);
    const result = await requestPlayback(type, id, nextSeason, nextEpisode);
    setPending(false);

    if (!("url" in result)) {
      setDenied(result.denied);
      return;
    }

    void recordProgress(type, id, nextSeason, nextEpisode);
    setCurrent({
      season: nextSeason,
      episode: nextEpisode,
      runtime: nextRuntime,
    });
    setSrc(result.url);

    if (type !== "tv" || nextSeason === null || nextEpisode === null) {
      setNext(null);
      return;
    }

    const episodes = await fetchSeasonEpisodes(id, nextSeason);
    setNext(nextEpisodeAfter(seasons, nextSeason, nextEpisode, episodes));
  }

  if (!available) {
    return (
      <Button
        size="lg"
        className="rounded-full"
        render={<Link href={`#${WATCH_ANCHOR}`} />}
      >
        <PlayerPlayFilled size={20} /> {t("detail.watch")}
      </Button>
    );
  }

  return (
    <>
      {/*
        `min-w-0` + `truncate` : sur la fiche, ce bouton partage sa ligne avec
        les favoris et la watchlist, qui eux ne se compriment pas. Sans quoi un
        libellé long les pousserait hors de l'écran.
      */}
      <Button
        size="lg"
        className="min-w-0 rounded-full"
        onClick={() => void play(season, episode, runtime)}
        disabled={pending}
      >
        <PlayerPlayFilled size={20} className="shrink-0" />
        <span className="truncate">
          {resumed && season !== null && episode !== null
            ? t(advanced ? "detail.playNext" : "detail.resume", {
                season,
                episode,
              })
            : resumed
              ? t("detail.rewatch")
              : t("detail.watch")}
        </span>
      </Button>

      {src && (
        <WatchDialog
          src={src}
          open={src !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSrc(null);
              setNext(null);
            }
          }}
          track={{
            type,
            id,
            season: current.season,
            episode: current.episode,
            runtime: current.runtime,
          }}
          next={
            next && {
              label: next.label,
              pending,
              onPlay: () =>
                void play(next.season, next.episode, next.runtime),
            }
          }
        />
      )}

      <AccessDialog denied={denied} onClose={() => setDenied(null)} />
    </>
  );
}
