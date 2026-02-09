// apps/web/src/app/admin/users/[id]/loading.tsx
import { ProfileSkeleton } from '@/components/ui/skeletons';

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

        <ProfileSkeleton />

        {/* Admin Actions */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Activity Log */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
