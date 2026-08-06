import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { ThemeProvider } from "@appica/ui-react/providers/theme-provider";
import { TooltipProvider } from "@appica/ui-react/tooltip";
import { FavoritesProvider } from "@/components/favorites-provider";
import { Footer } from "@/components/footer";
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

export const metadata: Metadata = {
  title: {
    default: "JUST — Films & Séries",
    template: "%s · JUST",
  },
  description:
    "Découvrez les films et séries du moment : tendances, bandes-annonces, casting et recommandations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <FavoritesProvider>
              <Navbar
                session={
                  <Suspense fallback={<NavbarSessionFallback />}>
                    <NavbarSession />
                  </Suspense>
                }
              />
              <main className="flex flex-1 flex-col">{children}</main>
              <Footer />
            </FavoritesProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
