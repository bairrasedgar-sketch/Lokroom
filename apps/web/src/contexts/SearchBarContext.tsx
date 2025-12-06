"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Category = {
  key: string;
  label: string;
  icon: string;
  count: number;
};

type SearchBarContextType = {
  searchBarElement: ReactNode | null;
  setSearchBarElement: (element: ReactNode | null) => void;
  showInNavbar: boolean;
  setShowInNavbar: (show: boolean) => void;
  // Catégories
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
};

const SearchBarContext = createContext<SearchBarContextType | null>(null);

export function SearchBarProvider({ children }: { children: ReactNode }) {
  const [searchBarElement, setSearchBarElement] = useState<ReactNode | null>(null);
  const [showInNavbar, setShowInNavbar] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <SearchBarContext.Provider
      value={{
        searchBarElement,
        setSearchBarElement,
        showInNavbar,
        setShowInNavbar,
        categories,
        setCategories,
        activeCategory,
        setActiveCategory,
      }}
    >
      {children}
    </SearchBarContext.Provider>
  );
}

export function useSearchBar() {
  const context = useContext(SearchBarContext);
  if (!context) {
    throw new Error("useSearchBar must be used within a SearchBarProvider");
  }
  return context;
}

// Hook sécurisé pour les composants qui peuvent être en dehors du provider
export function useSearchBarSafe() {
  return useContext(SearchBarContext);
}
