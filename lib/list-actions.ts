"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { isMediaType, isTmdbId } from "./collections";
import {
  addListItem,
  createList,
  deleteList,
  DESCRIPTION_MAX,
  ownsList,
  removeListItem,
  TITLE_MAX,
  updateList,
} from "./lists";
import { isSupabaseAdminConfigured } from "./supabase";
import type { MediaType } from "./types";

export type ListResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "unavailable" | "invalid" | "forbidden" };

const OK: ListResult = { ok: true };

/** UUID v4 tel que Postgres les génère : rien d'autre n'est un identifiant de liste. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cleanTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const title = value.trim().slice(0, TITLE_MAX);
  return title.length > 0 ? title : null;
}

function cleanDescription(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const description = value.trim().slice(0, DESCRIPTION_MAX);
  return description.length > 0 ? description : null;
}

/**
 * Session + base + propriété de la liste, vérifiées ensemble.
 *
 * Toutes les écritures passent par ici : l'identifiant de liste arrive du
 * client, il ne prouve rien tant qu'on ne l'a pas rattaché au compte connecté.
 */
async function authorize(
  listId: string,
): Promise<{ userId: string } | ListResult> {
  if (!UUID.test(listId)) return { ok: false, reason: "invalid" };

  const user = await getSession();
  if (!user) return { ok: false, reason: "unauthenticated" };

  if (!isSupabaseAdminConfigured()) return { ok: false, reason: "unavailable" };

  if (!(await ownsList(user.id, listId))) {
    return { ok: false, reason: "forbidden" };
  }

  return { userId: user.id };
}

export async function createListAction(
  title: string,
  description: string,
): Promise<ListResult & { slug?: string }> {
  const cleaned = cleanTitle(title);
  if (!cleaned) return { ok: false, reason: "invalid" };

  const user = await getSession();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!isSupabaseAdminConfigured()) return { ok: false, reason: "unavailable" };

  const list = await createList(user.id, cleaned, cleanDescription(description));
  revalidatePath("/lists");
  return { ok: true, slug: list.slug };
}

export async function updateListAction(
  listId: string,
  patch: { title?: string; description?: string; isPublic?: boolean },
): Promise<ListResult> {
  const auth = await authorize(listId);
  if ("ok" in auth) return auth;

  const next: { title?: string; description?: string | null; isPublic?: boolean } =
    {};

  if (patch.title !== undefined) {
    const title = cleanTitle(patch.title);
    if (!title) return { ok: false, reason: "invalid" };
    next.title = title;
  }
  if (patch.description !== undefined) {
    next.description = cleanDescription(patch.description);
  }
  if (patch.isPublic !== undefined) {
    next.isPublic = patch.isPublic === true;
  }

  await updateList(auth.userId, listId, next);
  revalidatePath("/lists");
  return OK;
}

export async function deleteListAction(listId: string): Promise<ListResult> {
  const auth = await authorize(listId);
  if ("ok" in auth) return auth;

  await deleteList(auth.userId, listId);
  revalidatePath("/lists");
  return OK;
}

export async function toggleListItemAction(
  listId: string,
  mediaType: MediaType,
  tmdbId: number,
  present: boolean,
): Promise<ListResult> {
  if (!isMediaType(mediaType) || !isTmdbId(tmdbId)) {
    return { ok: false, reason: "invalid" };
  }

  const auth = await authorize(listId);
  if ("ok" in auth) return auth;

  if (present) {
    await addListItem(listId, tmdbId, mediaType);
  } else {
    await removeListItem(listId, tmdbId, mediaType);
  }

  revalidatePath("/lists");
  return OK;
}
