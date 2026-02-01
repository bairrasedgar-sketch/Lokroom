"use client";

import { toast } from "sonner";

type ShareButtonProps = {
  className?: string;
  variant?: "mobile" | "desktop";
};

export default function ShareButton({ className = "", variant = "desktop" }: ShareButtonProps) {
  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copie !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`flex items-center justify-center h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm ${className}`}
      >
        <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 hover:border-black ${className}`}
    >
      <span>Partager</span>
    </button>
  );
}
