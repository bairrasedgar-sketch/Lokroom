// apps/web/src/app/become-host/loading.tsx
export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="h-12 w-96 bg-gray-200 rounded mx-auto" />
          <div className="h-6 w-full bg-gray-100 rounded mx-auto" />
          <div className="h-6 w-5/6 bg-gray-100 rounded mx-auto" />
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto" />
              <div className="h-5 w-32 bg-gray-100 rounded mx-auto" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 space-y-3">
                <div className="h-12 w-12 bg-gray-200 rounded" />
                <div className="h-5 w-32 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-5/6 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <div className="h-12 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-4 w-48 bg-gray-100 rounded mx-auto" />
        </div>
      </div>
    </main>
  );
}
