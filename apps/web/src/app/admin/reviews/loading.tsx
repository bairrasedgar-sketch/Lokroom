// apps/web/src/app/admin/reviews/loading.tsx
import { TableSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-100 rounded" />
            <div className="h-10 w-32 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-100 rounded" />
          ))}
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
