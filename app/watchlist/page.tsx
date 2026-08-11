import type { Metadata } from "next";
import { Suspense } from "react";
import { BookmarkOff } from "@appica/icons-react";
import { CollectionPage } from "@/components/collection-page";
import { GridSkeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default function WatchlistPage() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<GridSkeleton count={6} />}>
        <CollectionPage
          kind="watchlist"
          prefix="watchlist"
          path="/watchlist"
          icon={<BookmarkOff size={30} />}
        />
      </Suspense>
    </div>
  );
}
