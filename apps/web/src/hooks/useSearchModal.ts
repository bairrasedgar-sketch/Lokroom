"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type BookingMode = "days" | "hours";

export function useSearchModal() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [bookingMode, setBookingMode] = useState<BookingMode>("days");
  const [selectedTime, setSelectedTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const totalGuests = adults + children;

  const handleSearch = async () => {
    const params = new URLSearchParams();

    if (destination) params.set("q", destination);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedCountry) params.set("country", selectedCountry);
    if (selectedPlaceId) params.set("placeId", selectedPlaceId);
    if (selectedCategory) params.set("type", selectedCategory);
    if (startDate) params.set("startDate", startDate);
    if (bookingMode === "days" && endDate) params.set("endDate", endDate);
    if (bookingMode === "hours") {
      params.set("mode", "hourly");
      if (selectedTime) params.set("startTime", selectedTime);
      if (endTime) params.set("endTime", endTime);
    }
    if (totalGuests > 1) params.set("guests", totalGuests.toString());
    if (adults > 1) params.set("adults", adults.toString());
    if (children > 0) params.set("children", children.toString());
    if (pets > 0) params.set("pets", pets.toString());

    router.push(`/listings?${params.toString()}`);
  };

  const clearAll = () => {
    setDestination("");
    setSelectedCity("");
    setSelectedCountry("");
    setStartDate("");
    setEndDate("");
    setAdults(1);
    setChildren(0);
    setPets(0);
  };

  return {
    destination,
    setDestination,
    selectedCity,
    setSelectedCity,
    selectedCountry,
    setSelectedCountry,
    selectedPlaceId,
    setSelectedPlaceId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    adults,
    setAdults,
    children,
    setChildren,
    pets,
    setPets,
    totalGuests,
    selectedCategory,
    setSelectedCategory,
    bookingMode,
    setBookingMode,
    selectedTime,
    setSelectedTime,
    endTime,
    setEndTime,
    handleSearch,
    clearAll,
  };
}
