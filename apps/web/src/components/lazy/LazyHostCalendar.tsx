"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";

// Skeleton loader pour le calendrier
function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Calendar navigation skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Calendar grid skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Week days */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="py-3">
              <div className="h-3 w-8 mx-auto bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[80px] border-b border-r border-gray-100 p-1">
              <div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Legend skeleton */}
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Import dynamique du calendrier
const HostCalendarComponent = dynamic(() => import("@/components/calendar/HostCalendar"), {
  loading: () => <CalendarSkeleton />,
  ssr: false, // Le calendrier est interactif, pas besoin de SSR
});

type HostCalendarProps = ComponentProps<typeof import("@/components/calendar/HostCalendar").default>;

export default function LazyHostCalendar(props: HostCalendarProps) {
  return <HostCalendarComponent {...props} />;
}
