"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

type ShareButtonProps = {
  className?: string;
  variant?: "mobile" | "desktop";
  title?: string;
};

export default function ShareButton({ className = "", variant = "desktop", title }: ShareButtonProps) {
  const { t } = useTranslation();
  const [isSharing, setIsSharing] = useState(false);

  async function handleShare() {
    if (isSharing) return;

    setIsSharing(true);
    const url = window.location.href;
    const shareTitle = title || document.title;

    try {
      // Check if Web Share API is available (typically on mobile)
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          url: url,
        });
        // Note: No success toast for native share as the OS handles feedback
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        toast.success(t.listingDetail.linkCopied);
      }
    } catch (error) {
      // User cancelled share or error occurred
      // AbortError means user cancelled, which is not an error
      if (error instanceof Error && error.name !== "AbortError") {
        // Try clipboard as fallback if share failed
        try {
          await navigator.clipboard.writeText(url);
          toast.success(t.listingDetail.linkCopied);
        } catch {
          toast.error(t.listingDetail.copyError);
        }
      }
    } finally {
      setIsSharing(false);
    }
  }

  // Loading spinner icon
  const LoadingIcon = () => (
    <svg className="h-5 w-5 animate-spin text-gray-900" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  // Share icon
  const ShareIcon = () => (
    <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  );

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={handleShare}
        disabled={isSharing}
        className={`flex items-center justify-center h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-opacity ${isSharing ? "opacity-70" : ""} ${className}`}
      >
        {isSharing ? <LoadingIcon /> : <ShareIcon />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={isSharing}
      className={`inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 hover:border-black transition-opacity ${isSharing ? "opacity-70" : ""} ${className}`}
    >
      <span>{isSharing ? t.common.loading : t.listingDetail.share}</span>
    </button>
  );
}
