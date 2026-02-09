// apps/web/src/app/account/loading.tsx
import { ProfileSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />

        {/* Profile Section */}
        <ProfileSkeleton />

        {/* Settings Sections */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
