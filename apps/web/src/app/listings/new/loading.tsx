// apps/web/src/app/listings/new/loading.tsx
import { FormSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
          <div className="h-2 bg-gray-100 rounded-full" />
        </div>

        {/* Step Title */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-96 bg-gray-100 rounded" />
        </div>

        {/* Form Content */}
        <div className="border rounded-lg p-8">
          <FormSkeleton />
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div className="h-10 w-32 bg-gray-100 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </main>
  );
}
