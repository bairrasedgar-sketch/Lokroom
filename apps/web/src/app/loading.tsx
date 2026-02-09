// apps/web/src/app/loading.tsx
import { CardGridSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8 animate-pulse">
        {/* Hero Section Skeleton */}
        <section className="space-y-4">
          <div className="h-12 w-96 bg-gray-200 rounded mx-auto" />
          <div className="h-6 w-64 bg-gray-100 rounded mx-auto" />
        </section>

        {/* Search Bar Skeleton */}
        <div className="max-w-4xl mx-auto">
          <div className="h-16 bg-gray-100 rounded-full" />
        </div>

        {/* Featured Listings Skeleton */}
        <section className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <CardGridSkeleton count={6} />
        </section>
      </div>
    </main>
  );
}
