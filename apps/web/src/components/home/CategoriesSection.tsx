"use client";

import CategoryIcon from "../CategoryIcon";

type Category = {
  key: string;
  label: string;
  icon: string;
  count: number;
};

type CategoriesSectionProps = {
  isScrolled: boolean;
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
};

function CategoryButton({
  category,
  label,
  isActive,
  onClick,
}: {
  category: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-1 px-3 py-2 transition-all duration-300 flex-shrink-0 ${
        isActive
          ? "text-gray-900"
          : "text-gray-400 hover:text-gray-600"
      }`}
    >
      <div className={`relative p-2 rounded-full transition-all duration-300 ${
        isActive
          ? "bg-gray-100"
          : "group-hover:bg-gray-50"
      }`}>
        <CategoryIcon category={category} isActive={isActive} isAnimating={false} />
      </div>
      <span className={`whitespace-nowrap text-[11px] font-medium ${isActive ? "text-gray-900" : "text-gray-500"}`}>
        {label}
      </span>
    </button>
  );
}

export function CategoriesSection({ isScrolled, categories, activeCategory, onCategoryChange }: CategoriesSectionProps) {
  return (
    <section
      className={`border-b border-gray-200 bg-white transition-all duration-500 ease-out ${
        isScrolled
          ? "opacity-0 max-h-0 py-0 overflow-hidden -translate-y-2"
          : "opacity-100 max-h-24 py-1 translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-3">
          {/* Bouton "Tous" - fixe à gauche */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 flex-shrink-0 text-sm ${
              activeCategory === null
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <svg className={`h-4 w-4 ${activeCategory === null ? "text-white" : "text-gray-700"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="whitespace-nowrap font-medium">Tous</span>
          </button>

          {/* Séparateur */}
          <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

          {/* Autres catégories - scrollables */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin flex-1">
            {categories.map((cat) => (
              <CategoryButton
                key={cat.key}
                category={cat.key}
                label={cat.label}
                isActive={activeCategory === cat.key}
                onClick={() => onCategoryChange(cat.key === activeCategory ? null : cat.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
