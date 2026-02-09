// apps/web/src/app/onboarding/loading.tsx
import { FormSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
          <div className="h-2 bg-gray-100 rounded-full" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-4 w-96 bg-gray-100 rounded mx-auto" />
        </div>

        {/* Form */}
        <div className="border rounded-lg p-8">
          <FormSkeleton />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <div className="h-10 w-32 bg-gray-100 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </main>
  );
}
