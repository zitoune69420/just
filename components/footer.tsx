export function Footer() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-foreground-muted sm:flex-row sm:px-6 lg:px-8">
        <p className="font-bold tracking-tighter text-foreground-strong">
          JUST<span className="text-foreground-muted">.</span>
        </p>
        <p>
          Ce produit utilise l’API TMDB sans être approuvé ni certifié par
          TMDB.
        </p>
      </div>
    </footer>
  );
}
