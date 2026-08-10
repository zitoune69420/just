import Image from "next/image";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { ExternalLink } from "@appica/icons-react";
import { getTranslator } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";
import { tmdbImage, WATCH_REGION } from "@/lib/media";
import type { MediaDetails, WatchOfferKind } from "@/lib/types";
import { WATCH_ANCHOR } from "./watch-button";

const OFFER_KEYS: Record<WatchOfferKind, MessageKey> = {
  flatrate: "watch.flatrate",
  free: "watch.free",
  ads: "watch.ads",
  rent: "watch.rent",
  buy: "watch.buy",
};

export async function WatchSection({ details }: { details: MediaDetails }) {
  if (!details.watch) return null;

  const t = await getTranslator();

  return (
    <section id={WATCH_ANCHOR} className="scroll-mt-28 space-y-4">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
        {t("watch.title")}
      </h2>

      <div className="max-w-4xl space-y-5 rounded-3xl border border-border/60 bg-background-subtle/60 p-5 backdrop-blur-sm sm:p-6">
            {details.watch.offers.map((offer) => (
              <div key={offer.kind} className="space-y-2.5">
                <Badge variant="soft" size="sm" className="rounded-full">
                  {t(OFFER_KEYS[offer.kind])}
                </Badge>
                <ul className="flex flex-wrap gap-2.5">
                  {offer.providers.map((provider) => (
                    <li
                      key={provider.id}
                      className="flex items-center gap-2.5 rounded-2xl bg-background-muted/60 py-1.5 pe-3.5 ps-1.5"
                    >
                      <Image
                        src={tmdbImage(provider.logo, "w185")}
                        alt=""
                        width={32}
                        height={32}
                        className="size-8 rounded-xl"
                      />
                      <span className="text-sm font-medium text-foreground-strong">
                        {provider.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                render={
                  <a
                    href={details.watch.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                {t("watch.allOffers")} <ExternalLink size={16} />
              </Button>
              <p className="text-xs text-foreground-subtle">
                {t("watch.region", { region: WATCH_REGION })}
          </p>
        </div>
      </div>
    </section>
  );
}
