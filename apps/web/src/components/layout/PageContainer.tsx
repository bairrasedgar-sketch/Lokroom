"use client";

import { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  /** Taille maximale du container */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Padding vertical */
  paddingY?: "sm" | "md" | "lg";
  /** Classes CSS additionnelles */
  className?: string;
};

/**
 * Container responsive qui s'adapte à toutes les tailles d'écran
 * - Mobile: pleine largeur avec padding minimal
 * - Tablette: largeur adaptée
 * - Desktop: largeur maximale centrée
 * - Grands écrans (1920px+): largeur étendue
 * - Très grands écrans (2560px+): largeur maximale étendue
 */
export default function PageContainer({
  children,
  size = "lg",
  paddingY = "md",
  className = "",
}: PageContainerProps) {
  // Classes de largeur maximale selon la taille
  const sizeClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl 2xl:max-w-6xl",
    lg: "max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px]",
    xl: "max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1920px] 4xl:max-w-[2400px]",
    full: "max-w-[1800px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] 4xl:max-w-[3000px]",
  };

  // Classes de padding vertical
  const paddingYClasses = {
    sm: "py-4 sm:py-6",
    md: "py-4 sm:py-6 lg:py-8",
    lg: "py-6 sm:py-8 lg:py-10 xl:py-12",
  };

  return (
    <div
      className={`
        mx-auto w-full
        px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12
        ${sizeClasses[size]}
        ${paddingYClasses[paddingY]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}
