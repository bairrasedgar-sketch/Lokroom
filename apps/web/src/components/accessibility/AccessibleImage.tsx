"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Accessible Image component with loading state and error handling
 * WCAG 2.1 Level A - 1.1.1 Non-text Content
 */
interface AccessibleImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  decorative?: boolean; // For decorative images that don't convey information
  caption?: string;
  sizes?: string;
}

export default function AccessibleImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = "",
  decorative = false,
  caption,
  sizes,
}: AccessibleImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // For decorative images, use empty alt and role="presentation"
  const imageAlt = decorative ? "" : alt;
  const imageRole = decorative ? "presentation" : undefined;

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        role="img"
        aria-label={decorative ? undefined : `Image non disponible: ${alt}`}
        style={!fill ? { width, height } : undefined}
      >
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageElement = (
    <div className={`relative ${fill ? "h-full w-full" : ""}`}>
      {isLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse ${fill ? "" : ""}`}
          aria-hidden="true"
        />
      )}
      <Image
        src={src}
        alt={imageAlt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        role={imageRole}
        sizes={sizes}
      />
    </div>
  );

  // Wrap in figure with caption if provided
  if (caption) {
    return (
      <figure>
        {imageElement}
        <figcaption className="mt-2 text-sm text-gray-600 text-center">
          {caption}
        </figcaption>
      </figure>
    );
  }

  return imageElement;
}

/**
 * Avatar component with fallback initials
 */
interface AccessibleAvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AccessibleAvatar({
  src,
  name,
  size = "md",
  className = "",
}: AccessibleAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
  };

  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  if (!src || hasError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600 ${sizeClasses[size]} ${className}`}
        role="img"
        aria-label={`Avatar de ${name}`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`Photo de profil de ${name}`}
      width={size === "xs" ? 24 : size === "sm" ? 32 : size === "md" ? 40 : size === "lg" ? 48 : 64}
      height={size === "xs" ? 24 : size === "sm" ? 32 : size === "md" ? 40 : size === "lg" ? 48 : 64}
      className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
