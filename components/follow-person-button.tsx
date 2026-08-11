"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@appica/ui-react/button";
import { UserCheck, UserPlus } from "@appica/icons-react";
import { togglePersonFollow } from "@/lib/follow-actions";
import { useTranslations } from "./i18n-provider";

/**
 * L'état initial vient du serveur : contrairement aux favoris, il n'y a qu'une
 * personne par page, pas de liste à précharger pour toute une grille.
 */
export function FollowPersonButton({
  personId,
  name,
  initialFollowing,
}: {
  personId: number;
  name: string;
  initialFollowing: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;

    const next = !following;
    setFollowing(next);
    setPending(true);

    const result = await togglePersonFollow(personId, next);
    setPending(false);

    if (result.ok) {
      router.refresh();
      return;
    }

    setFollowing(!next);
    if (result.reason === "unauthenticated") {
      const returnTo = encodeURIComponent(window.location.pathname);
      router.push(`/login?returnTo=${returnTo}`);
    }
  }

  return (
    <Button
      variant={following ? "outline" : "primary"}
      size="sm"
      className="rounded-full"
      aria-pressed={following}
      aria-busy={pending}
      aria-label={t(following ? "person.unfollowLabel" : "person.followLabel", {
        name,
      })}
      onClick={() => void handleClick()}
    >
      {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
      {t(following ? "person.following" : "person.follow")}
    </Button>
  );
}
