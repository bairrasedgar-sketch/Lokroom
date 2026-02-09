// apps/web/src/app/admin/loading.tsx
import { DashboardSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <DashboardSkeleton />
    </main>
  );
}
