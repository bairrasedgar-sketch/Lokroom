"use client";

type GuestCounterProps = {
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  compact?: boolean;
};

export default function GuestCounter({ label, sublabel, value, min, max, onChange, compact = false }: GuestCounterProps) {
  const btnClass = compact
    ? "w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors"
    : "flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed";

  const countClass = compact
    ? "w-6 text-center text-sm font-semibold"
    : "w-8 text-center text-lg font-semibold text-gray-900";

  return (
    <div className={`flex items-center justify-between ${compact ? "py-3 border-b border-gray-100" : "p-4 border-b border-gray-100"}`}>
      <div className={compact ? "flex items-center gap-2" : ""}>
        <p className={compact ? "text-sm font-medium text-gray-900" : "font-medium text-gray-900"}>{label}</p>
        <p className={compact ? "text-[10px] text-gray-500" : "text-sm text-gray-500"}>{sublabel}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Réduire ${label}`}
          className={btnClass}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <span className={countClass}>{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Augmenter ${label}`}
          className={btnClass}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
