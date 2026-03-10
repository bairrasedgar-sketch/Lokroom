"use client";

import LocationAutocomplete from "../LocationAutocomplete";
import SearchCalendar from "./SearchCalendar";
import GuestCounter from "./GuestCounter";
import { useSearchModal } from "./useSearchModal";
import SearchModalMobile from "./SearchModalMobile";

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "destination" | "dates" | "guests";
};

export default function SearchModal({ isOpen, onClose, initialTab = "destination" }: SearchModalProps) {
  const ctx = useSearchModal(isOpen, onClose, initialTab);

  const {
    modalRef,
    isMobile, activeTab, setActiveTab,
    destination, setDestination,
    startDate, endDate, today,
    adults, setAdults, children, setChildren, pets, setPets,
    searchHistory,
    totalGuests,
    calendarMonth, bookingMode, setBookingMode,
    selectedTime, setSelectedTime, endTime, setEndTime,
    isDateDisabled, isDateInRange, handleDateClick,
    goToPreviousMonth, goToNextMonth, canGoPrevious,
    handleLocationSelect, handleHistorySelect, clearHistory,
    handleSearch, clearAll,
  } = ctx;

  if (!isOpen) return null;

  if (isMobile) {
    return <SearchModalMobile ctx={ctx} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-0 sm:pt-10 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] bg-white sm:rounded-3xl shadow-2xl overflow-hidden animate-modal-appear flex flex-col"
      >
        {/* Header tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full overflow-x-auto">
            {(["destination", "dates", "guests"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "destination" ? "Destination" : tab === "dates" ? "Dates" : "Voyageurs"}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la recherche"
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search summary bar */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
          <button
            onClick={() => setActiveTab("destination")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 transition-colors cursor-pointer ${destination ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="whitespace-nowrap">{destination || "Destination"}</span>
          </button>
          <button
            onClick={() => setActiveTab("dates")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 transition-colors cursor-pointer ${startDate ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="whitespace-nowrap">
              {startDate && endDate
                ? `${new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${new Date(endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                : startDate
                ? new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                : "Dates"}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("guests")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 transition-colors cursor-pointer ${totalGuests > 1 || pets > 0 ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="whitespace-nowrap">
              {totalGuests} {totalGuests > 1 ? "voyageurs" : "voyageur"}
              {pets > 0 && ` · ${pets} ${pets > 1 ? "animaux" : "animal"}`}
            </span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-4 sm:p-6 min-h-[300px] max-h-[calc(100vh-180px)] sm:max-h-[70vh] overflow-y-auto">
          {activeTab === "destination" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Où allez-vous ?</label>
                <LocationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  onSelect={handleLocationSelect}
                  placeholder="Rechercher une ville, un pays..."
                  autoFocus={true}
                  popularCities={[
                    { main: "Paris", secondary: "France", icon: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop&q=80" },
                    { main: "Montréal", secondary: "Canada", icon: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=400&h=400&fit=crop&q=80" },
                    { main: "Lyon", secondary: "France", icon: "/images/lyon.webp" },
                    { main: "Marseille", secondary: "France", icon: "/images/marseille.webp" },
                    { main: "Toronto", secondary: "Canada", icon: "https://images.unsplash.com/photo-1507992781348-310259076fe0?w=400&h=400&fit=crop&q=80" },
                    { main: "Bordeaux", secondary: "France", icon: "/images/bordeaux.webp" },
                  ]}
                />
              </div>

              {searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Recherches récentes</h3>
                    <button onClick={clearHistory} className="text-xs text-gray-500 hover:text-gray-700">Effacer</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 5).map((history) => (
                      <button
                        key={history.id}
                        onClick={() => handleHistorySelect(history)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 transition-colors"
                      >
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {history.destination}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "dates" && (
            <SearchCalendar
              calendarMonth={calendarMonth}
              startDate={startDate}
              endDate={endDate}
              today={today}
              bookingMode={bookingMode}
              selectedTime={selectedTime}
              endTime={endTime}
              compact={false}
              onDateClick={handleDateClick}
              onPrevMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              canGoPrev={canGoPrevious}
              isDateDisabled={isDateDisabled}
              isDateInRange={isDateInRange}
              onBookingModeChange={setBookingMode}
              onTimeChange={(s, e) => { setSelectedTime(s); setEndTime(e); }}
            />
          )}

          {activeTab === "guests" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Qui voyage ?</h3>
              <GuestCounter label="Adultes" sublabel="13 ans et plus" value={adults} min={1} max={16} onChange={setAdults} />
              <GuestCounter label="Enfants" sublabel="Jusqu'à 12 ans" value={children} min={0} max={10} onChange={setChildren} />
              <GuestCounter label="Animaux de compagnie" sublabel="Chiens, chats..." value={pets} min={0} max={5} onChange={setPets} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
          <button onClick={clearAll} className="text-xs font-medium text-gray-500 hover:text-gray-900 underline">
            Effacer
          </button>
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Rechercher
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal-appear {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-appear { animation: modal-appear 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
