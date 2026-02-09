// apps/web/src/app/search/loading.tsx
import { CardGridSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        {/* Filters Skeleton */}
        <div className="flex items-center gap-4 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-100 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Results Count Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-40 bg-gray-100 rounded" />
        </div>

        {/* Listings Grid Skeleton */}
        <CardGridSkeleton count={9} />
      </div>
    </main>
  );
}
