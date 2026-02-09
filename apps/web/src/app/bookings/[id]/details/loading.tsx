// apps/web/src/app/bookings/[id]/details/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="border rounded-lg p-6 space-y-3">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-6 space-y-3">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
