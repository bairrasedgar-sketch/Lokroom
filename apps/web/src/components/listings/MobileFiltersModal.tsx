"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

type MobileFiltersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  hasPhoto: boolean;
  onSubmit: () => void;
  labels: Record<string, string>;
};

export default function MobileFiltersModal({
  isOpen,
  onClose,
  minPrice,
  maxPrice,
  minRating,
  hasPhoto,
  onSubmit,
  labels,
}: MobileFiltersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <XMarkIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{labels.filtersTitle}</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="overflow-y-auto h-[calc(100vh-140px)] pb-4">
        {/* Section Prix */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{labels.priceScale2}</h2>
              <p className="text-sm text-gray-500">{labels.priceScaleDesc}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">{labels.minimum}</label>
              <input type="number" name="minPrice" min={0} defaultValue={minPrice} placeholder={labels.minPlaceholder} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-gray-900 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">{labels.maximum}</label>
              <input type="number" name="maxPrice" min={0} defaultValue={maxPrice} placeholder={labels.maxPlaceholder} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-gray-900 focus:bg-white transition-all" />
            </div>
          </div>
        </div>

        <div className="h-2 bg-gray-50" />

        {/* Section Note */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl">
              <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{labels.minRating}</h2>
              <p className="text-sm text-gray-500">Qualite des espaces</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[{ value: "", label: labels.allRatings }, { value: "3", label: labels.rating3Plus }, { value: "4", label: labels.rating4Plus }, { value: "5", label: labels.rating5Only }].map((opt) => (
              <label key={opt.value || "all"} className={`cursor-pointer px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${(minRating || "") === opt.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                <input type="radio" name="minRating" value={opt.value} defaultChecked={(minRating || "") === opt.value} className="hidden" />
                {opt.label}
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input type="checkbox" name="hasPhoto" value="1" defaultChecked={hasPhoto} className="h-5 w-5 rounded-lg border-gray-300 text-gray-900 focus:ring-gray-900" />
            <span className="text-sm text-gray-700">{labels.onlyWithPhotos}</span>
          </label>
        </div>

        <div className="h-2 bg-gray-50" />

        {/* Section Chambres */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-100 to-violet-50 rounded-2xl">
              <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{labels.roomsAndBeds}</h2>
              <p className="text-sm text-gray-500">Configuration</p>
            </div>
          </div>
          <div className="space-y-3">
            {[{ key: "chambres", label: labels.bedrooms }, { key: "lits", label: labels.beds }, { key: "sallesDeBain", label: labels.bathrooms }].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <input type="number" min={0} name={item.key} placeholder={labels.anyOption} className="w-20 text-center py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-gray-900" />
              </div>
            ))}
          </div>
        </div>

        <div className="h-2 bg-gray-50" />

        {/* Section Commodites */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{labels.amenities}</h2>
              <p className="text-sm text-gray-500">Equipements</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[{ key: "wifi", label: labels.wifi }, { key: "stationnement_gratuit", label: labels.freeParking }, { key: "climatisation", label: labels.airConditioning }, { key: "chauffage", label: labels.heating }, { key: "television", label: labels.tv }].map((item) => (
              <label key={item.key} className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                <input type="checkbox" name="amenities" value={item.key} className="hidden" />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div className="h-2 bg-gray-50" />

        {/* Section Type */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl">
              <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{labels.propertyType}</h2>
              <p className="text-sm text-gray-500">Categorie</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[{ key: "maison", label: labels.house }, { key: "appartement", label: labels.apartment }, { key: "bureau", label: labels.office }, { key: "parking", label: labels.parking }].map((item) => (
              <label key={item.key} className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                <input type="checkbox" name="spaceType" value={item.key} className="hidden" />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          <button type="reset" className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{labels.clearAll}</button>
          <button type="submit" onClick={onSubmit} className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl text-base font-semibold shadow-lg active:scale-[0.98] transition-transform">{labels.showResults}</button>
        </div>
      </div>
    </div>
  );
}
