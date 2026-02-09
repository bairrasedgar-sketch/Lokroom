// apps/web/src/components/ui/skeletons.tsx

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-gray-100 animate-pulse" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <section className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="h-7 w-72 bg-gray-200 rounded" />
      <div className="aspect-[4/3] bg-gray-100 rounded" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          <div className="h-5 bg-gray-100 rounded w-32" />
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>
        <div className="space-y-3">
          <div className="h-24 bg-gray-100 rounded" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    </section>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-100 rounded" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 border rounded-lg space-y-3">
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-8 w-32 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg flex items-center gap-4">
            <div className="h-16 w-16 bg-gray-100 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg flex items-center gap-4 animate-pulse">
      <div className="h-20 w-20 bg-gray-100 rounded" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 rounded" />
        <div className="h-3 w-1/3 bg-gray-100 rounded" />
      </div>
      <div className="h-8 w-24 bg-gray-200 rounded" />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        <div className="h-16 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
      <div className="h-10 w-32 bg-gray-200 rounded" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-3 animate-pulse">
      <div className="h-4 w-24 bg-gray-100 rounded" />
      <div className="h-8 w-32 bg-gray-200 rounded" />
      <div className="h-3 w-20 bg-gray-100 rounded" />
    </div>
  );
}
