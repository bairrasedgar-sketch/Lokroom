// apps/web/src/app/bookings/[id]/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />

        <div className="grid md:grid-cols-3 gap-6">
          {/* Booking Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="border rounded-lg p-6 space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="flex gap-4">
                <div className="h-24 w-24 bg-gray-100 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="border rounded-lg p-6 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
