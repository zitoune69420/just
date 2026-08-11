import { supabaseAdmin } from "./supabase";
import type { MediaType } from "./types";

export interface MediaList {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
  /** Nombre de titres, renseigné par les lectures qui le demandent. */
  count?: number;
}

export interface ListItem {
  tmdbId: number;
  mediaType: MediaType;
  position: number;
}

interface ListRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

interface ListItemRow {
  tmdb_id: number;
  media_type: MediaType;
  position: number;
}

const LIST_COLUMNS = "id, slug, title, description, is_public, updated_at";

export const TITLE_MAX = 80;

export const DESCRIPTION_MAX = 300;

/** Titres par liste : garde-fou contre une liste qui ferait exploser la page. */
export const ITEMS_MAX = 200;

function toList(row: ListRow): MediaList {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    isPublic: row.is_public,
    updatedAt: row.updated_at,
  };
}

/**
 * Adresse publique d'une liste : une base lisible tirée du titre, suivie d'un
 * suffixe aléatoire. Le suffixe n'est pas décoratif — c'est lui qui empêche de
 * deviner l'adresse d'une liste ou d'énumérer celles des autres.
 */
export function buildSlug(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .toLowerCase();

  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return base ? `${base}-${suffix}` : suffix;
}

export async function getUserLists(userId: string): Promise<MediaList[]> {
  const { data, error } = await supabaseAdmin()
    .from("lists")
    .select(`${LIST_COLUMNS}, list_items(count)`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase lists: ${error.message}`);
  }

  type WithCount = ListRow & { list_items: { count: number }[] };

  return ((data ?? []) as WithCount[]).map((row) => ({
    ...toList(row),
    count: row.list_items?.[0]?.count ?? 0,
  }));
}

/**
 * Liste par adresse publique. `ownerId` permet à l'auteur de consulter sa
 * propre liste tant qu'elle n'est pas publiée ; pour tout le monde d'autre, une
 * liste privée est introuvable.
 */
export async function getListBySlug(
  slug: string,
  viewerId: string | null,
): Promise<(MediaList & { ownerId: string; ownerName: string }) | null> {
  const { data, error } = await supabaseAdmin()
    .from("lists")
    .select(`${LIST_COLUMNS}, user_id, users(name)`)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase lists: ${error.message}`);
  }
  if (!data) return null;

  // Supabase rend les jointures sous forme de tableau, même sur une clé unique.
  const row = data as unknown as ListRow & {
    user_id: string;
    users: { name: string }[] | { name: string } | null;
  };

  if (!row.is_public && row.user_id !== viewerId) return null;

  const owner = Array.isArray(row.users) ? row.users[0] : row.users;

  return {
    ...toList(row),
    ownerId: row.user_id,
    ownerName: owner?.name ?? "",
  };
}

export async function getListItems(listId: string): Promise<ListItem[]> {
  const { data, error } = await supabaseAdmin()
    .from("list_items")
    .select("tmdb_id, media_type, position")
    .eq("list_id", listId)
    .order("position", { ascending: true })
    .order("added_at", { ascending: true })
    .limit(ITEMS_MAX);

  if (error) {
    throw new Error(`Supabase list_items: ${error.message}`);
  }

  return (data ?? []).map((row: ListItemRow) => ({
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    position: row.position,
  }));
}

export async function createList(
  userId: string,
  title: string,
  description: string | null,
): Promise<MediaList> {
  const { data, error } = await supabaseAdmin()
    .from("lists")
    .insert({
      user_id: userId,
      slug: buildSlug(title),
      title,
      description,
    })
    .select(LIST_COLUMNS)
    .single<ListRow>();

  if (error) {
    throw new Error(`Supabase lists: ${error.message}`);
  }

  return toList(data);
}

/** Vrai si la liste existe et appartient bien au compte. */
export async function ownsList(
  userId: string,
  listId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Supabase lists: ${error.message}`);
  }

  return data !== null;
}

export async function updateList(
  userId: string,
  listId: string,
  patch: { title?: string; description?: string | null; isPublic?: boolean },
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.isPublic !== undefined) row.is_public = patch.isPublic;

  const { error } = await supabaseAdmin()
    .from("lists")
    .update(row)
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Supabase lists: ${error.message}`);
  }
}

export async function deleteList(
  userId: string,
  listId: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Supabase lists: ${error.message}`);
  }
}

export async function addListItem(
  listId: string,
  tmdbId: number,
  mediaType: MediaType,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("list_items")
    .upsert(
      { list_id: listId, tmdb_id: tmdbId, media_type: mediaType },
      { onConflict: "list_id,tmdb_id,media_type", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error(`Supabase list_items: ${error.message}`);
  }
}

export async function removeListItem(
  listId: string,
  tmdbId: number,
  mediaType: MediaType,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    throw new Error(`Supabase list_items: ${error.message}`);
  }
}

/** Identifiants des listes d'un compte contenant déjà ce titre. */
export async function listsContaining(
  userId: string,
  tmdbId: number,
  mediaType: MediaType,
): Promise<string[]> {
  const { data, error } = await supabaseAdmin()
    .from("list_items")
    .select("list_id, lists!inner(user_id)")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .eq("lists.user_id", userId);

  if (error) {
    throw new Error(`Supabase list_items: ${error.message}`);
  }

  return ((data ?? []) as { list_id: string }[]).map((row) => row.list_id);
}
