import { Skeleton } from "@appica/ui-react/skeleton";

export function PosterSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-2/3 w-full rounded-2xl" />
      <Skeleton className="mt-2.5 h-4 w-3/4 rounded-full" />
      <Skeleton className="mt-1.5 h-3 w-1/3 rounded-full" />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <Skeleton className="aspect-4/5 max-h-[560px] w-full rounded-3xl sm:aspect-video sm:rounded-4xl lg:aspect-21/9" />
  );
}

export function RowSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-48 rounded-full" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="w-36 shrink-0 sm:w-44">
            <PosterSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopRowSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-56 rounded-full" />
      <div className="flex items-end gap-4 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex shrink-0 items-end">
            <Skeleton className="h-24 w-14 rounded-2xl sm:h-36 sm:w-20" />
            <Skeleton className="-ms-6 aspect-2/3 w-32 rounded-2xl sm:-ms-8 sm:w-44" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }, (_, index) => (
        <PosterSkeleton key={index} />
      ))}
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <Skeleton className="h-96 w-full rounded-3xl lg:w-72 lg:shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }, (_, index) => (
            <PosterSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PersonSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <Skeleton className="aspect-2/3 w-40 shrink-0 rounded-3xl sm:w-56" />
        <div className="w-full max-w-2xl space-y-4 pb-1">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-2/3 rounded-2xl" />
          <Skeleton className="h-4 w-1/2 rounded-full" />
        </div>
      </div>
      <div className="max-w-3xl space-y-3">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-2/3 rounded-full" />
      </div>
      <RowSkeleton />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="pb-16">
      <Skeleton className="h-[45vh] min-h-80 w-full rounded-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 -mt-36 flex flex-col gap-6 sm:-mt-44 sm:flex-row sm:items-end sm:gap-8">
          <Skeleton className="aspect-2/3 w-40 shrink-0 rounded-3xl sm:w-56" />
          <div className="w-full max-w-2xl space-y-4 pb-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
            <Skeleton className="h-4 w-1/2 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="mt-12 max-w-3xl space-y-3">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-2/3 rounded-full" />
        </div>
      </div>
    </div>
  );
}
