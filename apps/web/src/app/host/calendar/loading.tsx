// apps/web/src/app/host/calendar/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-100 rounded" />
            <div className="h-10 w-10 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg p-6">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 rounded" />
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-100 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
