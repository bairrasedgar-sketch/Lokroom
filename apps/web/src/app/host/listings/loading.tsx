// apps/web/src/app/host/listings/loading.tsx
import { CardGridSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-40 bg-gray-100 rounded" />
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        <CardGridSkeleton count={6} />
      </div>
    </main>
  );
}
