// apps/web/src/app/contact/loading.tsx
import { FormSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="h-10 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-6 w-96 bg-gray-100 rounded mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="border rounded-lg p-6">
            <FormSkeleton />
          </div>
        </div>
      </div>
    </main>
  );
}
