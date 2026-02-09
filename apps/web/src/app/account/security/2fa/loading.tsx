// apps/web/src/app/account/security/2fa/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded" />

        <div className="border rounded-lg p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-5/6 bg-gray-100 rounded" />
          </div>

          <div className="flex justify-center">
            <div className="h-48 w-48 bg-gray-100 rounded" />
          </div>

          <div className="space-y-3">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </main>
  );
}
