// apps/web/src/app/bookings/[id]/confirmation/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto" />
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-4 w-96 bg-gray-100 rounded mx-auto" />
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="h-12 flex-1 bg-gray-200 rounded" />
          <div className="h-12 flex-1 bg-gray-100 rounded" />
        </div>
      </div>
    </main>
  );
}
