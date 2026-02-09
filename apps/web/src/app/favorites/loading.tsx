// apps/web/src/app/favorites/loading.tsx
import { CardGridSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-6 w-32 bg-gray-100 rounded" />
        </div>

        <CardGridSkeleton count={9} />
      </div>
    </main>
  );
}
