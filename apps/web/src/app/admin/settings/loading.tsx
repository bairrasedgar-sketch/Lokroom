// apps/web/src/app/admin/settings/loading.tsx
import { FormSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />

        {/* Settings Sections */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-6">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <FormSkeleton />
          </div>
        ))}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <div className="h-10 w-32 bg-gray-100 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </main>
  );
}
