// apps/web/src/app/host/bookings/loading.tsx
import { BookingCardSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-100 rounded-t" />
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
