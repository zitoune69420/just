import Link from "next/link";
import { Badge } from "@appica/ui-react/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@appica/ui-react/table";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/translate";
import { listReports, type ReportRow } from "@/lib/reports";
import { getMediaSummary } from "@/lib/tmdb";
import { toMedia } from "@/lib/media";
import { ResolveReportButton } from "./resolve-report-button";

function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** `S2 E3` quand le signalement vise un épisode, rien pour un film. */
function episodeLabel(report: ReportRow): string | null {
  return report.season !== null && report.episode !== null
    ? `S${report.season} E${report.episode}`
    : null;
}

export async function AdminReports({ resolved }: { resolved: boolean }) {
  const { locale, t } = await getLocaleAndTranslator();
  const { reports } = await listReports({ resolved });

  /**
   * La table ne stocke qu'un identifiant TMDB : le titre lisible est résolu ici.
   * `getMediaSummary` est mis en cache, donc deux signalements visant le même
   * titre ne coûtent qu'un appel.
   */
  const titles = await Promise.all(
    reports.map(async (report) => {
      try {
        const summary = await getMediaSummary(
          locale,
          report.mediaType,
          report.tmdbId,
        );
        return summary ? toMedia(summary, report.mediaType).title : null;
      } catch {
        return null;
      }
    }),
  );

  if (reports.length === 0) {
    return (
      <p className="rounded-md border border-border/60 bg-background-subtle/60 p-8 text-center text-sm text-foreground-muted">
        {t(resolved ? "admin.reportsResolvedEmpty" : "admin.reportsEmpty")}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("admin.reportTitleColumn")}</TableHead>
          <TableHead>{t("admin.reportReason")}</TableHead>
          <TableHead>{t("admin.reportReporter")}</TableHead>
          <TableHead>{t("admin.reportDate")}</TableHead>
          <TableHead>{t("admin.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report, index) => {
          const episode = episodeLabel(report);
          return (
            <TableRow key={report.id}>
              <TableCell>
                <Link
                  href={`/${report.mediaType}/${report.tmdbId}`}
                  className="font-medium text-foreground-strong underline underline-offset-4"
                >
                  {titles[index] ?? `#${report.tmdbId}`}
                </Link>
                {episode && (
                  <span className="ms-2 text-xs text-foreground-muted">
                    {episode}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="soft" size="sm" className="rounded-full">
                  {t(`report.reason.${report.reason}` as MessageKey)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-foreground-muted">
                {report.reporterName ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-foreground-muted">
                {formatDate(locale, report.createdAt)}
              </TableCell>
              <TableCell>
                <ResolveReportButton
                  id={report.id}
                  resolved={report.resolved}
                  label={t(
                    report.resolved
                      ? "admin.reportReopen"
                      : "admin.reportResolve",
                  )}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
