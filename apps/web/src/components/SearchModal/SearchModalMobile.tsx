"use client";

import LocationAutocomplete from "../LocationAutocomplete";
import CategoryIcon from "../CategoryIcon";
import SearchCalendar from "./SearchCalendar";
import GuestCounter from "./GuestCounter";
import { CATEGORIES, POPULAR_DESTINATIONS } from "./useSearchModal";
import type { useSearchModal } from "./useSearchModal";

type SearchModalMobileProps = {
  ctx: ReturnType<typeof useSearchModal>;
  onClose: () => void;
};

export default function SearchModalMobile({ ctx, onClose }: SearchModalMobileProps) {
  const {
    destinationRef, datesRef, guestsRef,
    destination, setDestination,
    selectedCity, setSelectedCity, setSelectedCountry, setSelectedPlaceId,
    startDate, setStartDate, endDate, today,
    adults, setAdults, children, setChildren, pets, setPets,
    selectedCategory, setSelectedCategory, animatingCategory, setAnimatingCategory,
    openSection, handleOpenSection,
    calendarMonth, bookingMode, setBookingMode,
    selectedTime, setSelectedTime, endTime, setEndTime,
    totalGuests,
    isDateDisabled, isDateInRange, handleDateClick,
    goToPreviousMonth, goToNextMonth, canGoPrevious,
    handleSearch, clearAll,
  } = ctx;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">Rechercher</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Catégories */}
        <div className="px-4 pt-2 pb-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Que recherchez-vous ?</h3>
          <div className="flex gap-2 overflow-x-auto py-1 -mx-4 px-4 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  if (selectedCategory === cat.key) {
                    setSelectedCategory(null);
                  } else {
                    setSelectedCategory(cat.key);
                    setAnimatingCategory(cat.key);
                    setTimeout(() => setAnimatingCategory(null), 600);
                  }
                }}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all flex-shrink-0 min-w-[72px] ${
                  selectedCategory === cat.key
                    ? "bg-gray-200 text-gray-900 ring-2 ring-gray-900"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <CategoryIcon category={cat.key} isActive={selectedCategory === cat.key} isAnimating={animatingCategory === cat.key} />
                <span className="text-[10px] font-medium whitespace-nowrap">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Destination */}
        <div ref={destinationRef} className="px-4 py-2">
          <button
            onClick={() => handleOpenSection("destination")}
            className={`w-full flex items-center p-3 rounded-2xl transition-all ${openSection === "destination" ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl">
                <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-sm font-semibold text-gray-900">Où allez-vous ?</h2>
                <p className="text-xs text-gray-500">{selectedCity || "Choisir une destination"}</p>
              </div>
            </div>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-out ${openSection === "destination" ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"}`}>
            <div className="space-y-3">
              <LocationAutocomplete
                value={destination}
                onChange={setDestination}
                onSelect={(place) => {
                  setDestination(place.mainText);
                  setSelectedCity(place.mainText);
                  setSelectedCountry(place.secondaryText.includes("Canada") ? "Canada" : "France");
                  if (place.placeId) setSelectedPlaceId(place.placeId);
                  setTimeout(() => handleOpenSection("dates"), 300);
                }}
                placeholder="Adresse, ville, région..."
                popularCities={POPULAR_DESTINATIONS.map(d => ({ main: d.city, secondary: d.country, icon: d.image }))}
              />

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Destinations populaires</h3>
                <div className="grid grid-cols-3 gap-2">
                  {POPULAR_DESTINATIONS.slice(0, 6).map((dest) => (
                    <button
                      key={dest.city}
                      onClick={() => {
                        if (selectedCity === dest.city) {
                          setDestination(""); setSelectedCity(""); setSelectedCountry("");
                        } else {
                          setDestination(dest.city); setSelectedCity(dest.city); setSelectedCountry(dest.country);
                          setTimeout(() => handleOpenSection("dates"), 300);
                        }
                      }}
                      className={`relative overflow-hidden rounded-xl aspect-square group ${selectedCity === dest.city ? "ring-2 ring-gray-900" : ""}`}
                    >
                      <img src={dest.image} alt={dest.city} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white font-semibold text-xs">{dest.city}</p>
                        <p className="text-white/80 text-[10px]">{dest.country}</p>
                      </div>
                      {selectedCity === dest.city && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div ref={datesRef} className="px-4 py-2">
          <button
            onClick={() => handleOpenSection("dates")}
            className={`w-full flex items-center p-3 rounded-2xl transition-all ${openSection === "dates" ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-sm font-semibold text-gray-900">Quand ?</h2>
                <p className="text-xs text-gray-500">
                  {startDate
                    ? `${new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}${endDate ? ` - ${new Date(endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : ""}`
                    : "Ajouter des dates"}
                </p>
              </div>
            </div>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-out ${openSection === "dates" ? "max-h-[600px] opacity-100 mt-3" : "max-h-0 opacity-0"}`}>
            <div className="space-y-3">
              {/* Quick date shortcuts */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                {[
                  { label: "Aujourd'hui", date: today },
                  { label: "Demain", date: new Date(Date.now() + 86400000).toISOString().split("T")[0] },
                  { label: "Ce week-end", date: (() => { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); return d.toISOString().split("T")[0]; })() },
                  { label: "Semaine prochaine", date: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })() },
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      setStartDate(option.date);
                    }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      startDate === option.date ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <SearchCalendar
                calendarMonth={calendarMonth}
                startDate={startDate}
                endDate={endDate}
                today={today}
                bookingMode={bookingMode}
                selectedTime={selectedTime}
                endTime={endTime}
                compact={true}
                onDateClick={handleDateClick}
                onPrevMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                canGoPrev={canGoPrevious}
                isDateDisabled={isDateDisabled}
                isDateInRange={isDateInRange}
                onBookingModeChange={setBookingMode}
                onTimeChange={(s, e) => { setSelectedTime(s); setEndTime(e); }}
              />

              <button
                onClick={() => handleOpenSection("guests")}
                className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>

        {/* Voyageurs */}
        <div ref={guestsRef} className="px-4 py-2">
          <button
            onClick={() => handleOpenSection("guests")}
            className={`w-full flex items-center p-3 rounded-2xl transition-all ${openSection === "guests" ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-sm font-semibold text-gray-900">Qui voyage ?</h2>
                <p className="text-xs text-gray-500">
                  {totalGuests} {totalGuests > 1 ? "voyageurs" : "voyageur"}{pets > 0 ? `, ${pets} ${pets > 1 ? "animaux" : "animal"}` : ""}
                </p>
              </div>
            </div>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-out ${openSection === "guests" ? "max-h-[400px] opacity-100 mt-3" : "max-h-0 opacity-0"}`}>
            <GuestCounter label="Adultes" sublabel="13 ans et plus" value={adults} min={1} max={16} onChange={setAdults} compact />
            <GuestCounter label="Enfants" sublabel="2 à 12 ans" value={children} min={0} max={10} onChange={setChildren} compact />
            <GuestCounter label="Animaux" sublabel="Chiens, chats..." value={pets} min={0} max={5} onChange={setPets} compact />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-3">
          <button onClick={clearAll} className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Effacer tout
          </button>
          <button
            onClick={handleSearch}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl text-base font-semibold shadow-lg shadow-gray-900/20 active:scale-[0.98] transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Rechercher
          </button>
        </div>
      </div>

      <style jsx global>{`
        .safe-area-bottom { padding-bottom: max(12px, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
}
