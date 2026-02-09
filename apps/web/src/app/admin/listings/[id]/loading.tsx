// apps/web/src/app/admin/listings/[id]/loading.tsx
import { ListingDetailSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-100 rounded" />
            <div className="h-10 w-32 bg-gray-100 rounded" />
          </div>
        </div>

        <ListingDetailSkeleton />

        {/* Admin Actions */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="flex gap-4">
            <div className="h-10 flex-1 bg-gray-100 rounded" />
            <div className="h-10 flex-1 bg-gray-100 rounded" />
            <div className="h-10 flex-1 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </main>
  );
}
