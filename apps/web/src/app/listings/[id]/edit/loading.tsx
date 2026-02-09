// apps/web/src/app/listings/[id]/edit/loading.tsx
import { FormSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-100 rounded" />
            <div className="h-10 w-32 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-100 rounded-t" />
          ))}
        </div>

        {/* Form Content */}
        <div className="border rounded-lg p-8">
          <FormSkeleton />
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <div className="h-10 w-32 bg-gray-100 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </main>
  );
}
