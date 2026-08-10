import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PersonDetailView } from "@/components/person-detail";
import { SetupNotice } from "@/components/setup-notice";
import { PersonSkeleton } from "@/components/skeletons";
import { getLocale, getLocaleAndTranslator } from "@/lib/i18n/server";
import { toPersonDetails } from "@/lib/media";
import { getPersonDetails, isTmdbConfigured } from "@/lib/tmdb";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isTmdbConfigured()) return {};
  const { id } = await params;
  const person = await getPersonDetails(await getLocale(), Number(id));
  if (!person) return {};
  const description = person.biography.slice(0, 200) || undefined;
  return {
    title: person.name,
    description,
    openGraph: { title: person.name, description, type: "profile" },
  };
}

export default function PersonPage({ params }: PageProps) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <Suspense fallback={<PersonSkeleton />}>
      {params.then(({ id }) => (
        <PersonContent id={Number(id)} />
      ))}
    </Suspense>
  );
}

async function PersonContent({ id }: { id: number }) {
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { locale, t } = await getLocaleAndTranslator();
  const person = await getPersonDetails(locale, id);
  if (!person) notFound();
  return <PersonDetailView person={toPersonDetails(person, { locale, t })} />;
}
