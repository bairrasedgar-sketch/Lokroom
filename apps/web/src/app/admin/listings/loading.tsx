// apps/web/src/app/admin/listings/loading.tsx
import { TableSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="flex gap-3">
            <div className="h-10 w-40 bg-gray-100 rounded" />
            <div className="h-10 w-32 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-100 rounded" />
          ))}
        </div>

        {/* Table */}
        <div className="border rounded-lg p-6">
          <TableSkeleton rows={12} cols={7} />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
