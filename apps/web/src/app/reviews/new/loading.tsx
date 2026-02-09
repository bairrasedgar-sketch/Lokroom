// apps/web/src/app/reviews/new/loading.tsx
import { FormSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />

        {/* Listing Info */}
        <div className="border rounded-lg p-4 flex gap-4">
          <div className="h-20 w-20 bg-gray-100 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Review Form */}
        <div className="border rounded-lg p-6">
          <FormSkeleton />
        </div>
      </div>
    </main>
  );
}
