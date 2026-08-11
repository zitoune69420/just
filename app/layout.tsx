import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { ThemeProvider } from "@appica/ui-react/providers/theme-provider";
import { TooltipProvider } from "@appica/ui-react/tooltip";
import { CollectionsProvider } from "@/components/collections-provider";
import { Footer } from "@/components/footer";
import { I18nProvider } from "@/components/i18n-provider";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { getLocale } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n/translate";
import { Navbar } from "@/components/navbar";
import {
  NavbarSession,
  NavbarSessionFallback,
} from "@/components/navbar-session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Découvrez les films et séries du moment : tendances, bandes-annonces, casting et recommandations.";

/** Base des URLs absolues des métadonnées (images OG comprises). */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "JUST — Films & Séries",
    template: "%s · JUST",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "JUST",
    locale: "fr_FR",
    title: "JUST — Films & Séries",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "JUST — Films & Séries",
    description: DESCRIPTION,
  },
};

/**
 * La langue vient d'un cookie, donc d'une lecture dynamique : elle doit vivre
 * sous un `<Suspense>`, sinon le prerender de chaque route échoue. Le `lang`
 * effectif est porté par un conteneur `display:contents`, qui n'ajoute aucune
 * boîte à la mise en page.
 */
async function Localized({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <div lang={locale} className="contents">
      <I18nProvider locale={locale} messages={getMessages(locale)}>
        <TooltipProvider>
          <CollectionsProvider>
            <Navbar
              session={
                <Suspense fallback={<NavbarSessionFallback />}>
                  <NavbarSession />
                </Suspense>
              }
            />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
          </CollectionsProvider>
        </TooltipProvider>
      </I18nProvider>
    </div>
  );
}

function ShellFallback() {
  return (
    <>
      <div className="chrome sticky top-0 z-50 h-16 border-b border-border/60" />
      <div className="flex-1" />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider defaultTheme="dark">
          <Suspense fallback={<ShellFallback />}>
            <Localized>{children}</Localized>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
