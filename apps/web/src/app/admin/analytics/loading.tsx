// apps/web/src/app/admin/analytics/loading.tsx
import { StatCardSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-80 bg-gray-100 rounded" />
          </div>
          <div className="border rounded-lg p-6 space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-80 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Full Width Chart */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-100 rounded" />
        </div>
      </div>
    </main>
  );
}
