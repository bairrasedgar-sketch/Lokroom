// apps/web/src/app/help/issue/loading.tsx
import { FormSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-100 rounded" />

        <div className="border rounded-lg p-6">
          <FormSkeleton />
        </div>
      </div>
    </main>
  );
}
