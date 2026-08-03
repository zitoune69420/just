import { cacheLife } from "next/cache";
import type { StreamSource } from "./streaming";

const SEARCH_URL = "https://archive.org/advancedsearch.php";

const COLLECTION = "feature_films";

const MAX_YEAR = 1980;

const TIMEOUT_MS = 5000;

interface ArchiveDoc {
  identifier: string;
  title?: string | string[];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(\s*\d{4}\s*\)/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function firstTitle(doc: ArchiveDoc): string {
  return Array.isArray(doc.title) ? (doc.title[0] ?? "") : (doc.title ?? "");
}

export async function findArchiveMovie(
  originalTitle: string,
  year: string,
): Promise<StreamSource | null> {
  "use cache";
  cacheLife("days");

  const releaseYear = Number(year);
  if (!Number.isInteger(releaseYear) || releaseYear > MAX_YEAR) return null;

  const title = originalTitle.replace(/["\\]/g, " ").trim();
  if (title.length < 2) return null;

  const url = new URL(SEARCH_URL);
  url.searchParams.set(
    "q",
    `title:("${title}") AND mediatype:movies AND year:${releaseYear} AND collection:(${COLLECTION})`,
  );
  url.searchParams.append("fl[]", "identifier");
  url.searchParams.append("fl[]", "title");
  url.searchParams.set("rows", "10");
  url.searchParams.set("output", "json");

  let docs: ArchiveDoc[];
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "just-movie-app", Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      response?: { docs?: ArchiveDoc[] };
    };
    docs = data.response?.docs ?? [];
  } catch {
    return null;
  }

  const wanted = normalize(title);
  const match = docs.find((doc) => normalize(firstTitle(doc)) === wanted);
  if (!match) return null;

  return { kind: "embed", url: `https://vidsrc-embed.ru/embed/movie/${match.identifier}` };
}
