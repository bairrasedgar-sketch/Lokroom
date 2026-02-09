// apps/web/src/app/admin/messages/loading.tsx
import { MessageSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />

        <div className="h-[calc(100vh-250px)] grid md:grid-cols-3 gap-4">
          {/* Conversations List */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="md:col-span-2 border rounded-lg flex flex-col">
            <div className="p-4 border-b flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {[...Array(6)].map((_, i) => (
                <MessageSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
