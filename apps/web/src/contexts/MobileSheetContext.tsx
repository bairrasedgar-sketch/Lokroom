"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type MobileSheetPosition = 'collapsed' | 'partial' | 'expanded';

type MobileSheetContextType = {
  /** Position actuelle du bottom sheet mobile */
  sheetPosition: MobileSheetPosition;
  setSheetPosition: (position: MobileSheetPosition) => void;
  /** Indique si on est sur une page avec bottom sheet (ex: /listings) */
  isSheetActive: boolean;
  setIsSheetActive: (active: boolean) => void;
  /** Indique si l'utilisateur scroll vers le bas (pour cacher la navbar) */
  isScrollingDown: boolean;
  setIsScrollingDown: (scrolling: boolean) => void;
};

const MobileSheetContext = createContext<MobileSheetContextType | null>(null);

export function MobileSheetProvider({ children }: { children: ReactNode }) {
  const [sheetPosition, setSheetPosition] = useState<MobileSheetPosition>('partial');
  const [isSheetActive, setIsSheetActive] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  return (
    <MobileSheetContext.Provider
      value={{
        sheetPosition,
        setSheetPosition,
        isSheetActive,
        setIsSheetActive,
        isScrollingDown,
        setIsScrollingDown,
      }}
    >
      {children}
    </MobileSheetContext.Provider>
  );
}

export function useMobileSheet() {
  const context = useContext(MobileSheetContext);
  if (!context) {
    throw new Error("useMobileSheet must be used within a MobileSheetProvider");
  }
  return context;
}

// Hook securise pour les composants qui peuvent etre en dehors du provider
export function useMobileSheetSafe() {
  return useContext(MobileSheetContext);
}
