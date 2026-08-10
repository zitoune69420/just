import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MediaDetailView } from "@/components/media-detail";
import { SetupNotice } from "@/components/setup-notice";
import { DetailSkeleton } from "@/components/skeletons";
import { getLocale, getLocaleAndTranslator } from "@/lib/i18n/server";
import { toTvDetails } from "@/lib/media";
import { getTvDetails, isTmdbConfigured } from "@/lib/tmdb";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isTmdbConfigured()) return {};
  const { id } = await params;
  const series = await getTvDetails(await getLocale(), Number(id));
  if (!series) return {};
  const description = series.overview || undefined;
  return {
    title: series.name,
    description,
    openGraph: { title: series.name, description, type: "video.tv_show" },
  };
}

export default function TvPage({ params }: PageProps) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      {params.then(({ id }) => (
        <TvContent id={Number(id)} />
      ))}
    </Suspense>
  );
}

async function TvContent({ id }: { id: number }) {
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { locale, t } = await getLocaleAndTranslator();
  const series = await getTvDetails(locale, id);
  if (!series) notFound();
  return <MediaDetailView details={toTvDetails(series, { locale, t })} />;
}
