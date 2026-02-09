/**
 * Skeleton loader for HomeClient component
 * Provides a loading state while the main component is being lazy loaded
 */
export default function HomeClientSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="animate-pulse">
        {/* Search bar skeleton */}
        <div className="h-20 bg-gray-200 border-b" />

        <div className="container mx-auto px-4 py-8">
          {/* Hero section skeleton */}
          <div className="mb-12">
            <div className="h-12 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
          </div>

          {/* Categories skeleton */}
          <div className="flex gap-4 overflow-x-auto mb-8 pb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex-shrink-0">
                <div className="h-16 w-24 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Listings grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-64 bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
