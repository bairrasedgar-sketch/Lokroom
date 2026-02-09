"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SearchModal from "./SearchModal";
import { useSearchBar } from "@/contexts/SearchBarContext";
import { HeroSection } from "./home/HeroSection";
import { SearchBarSection } from "./home/SearchBarSection";
import { CategoriesSection } from "./home/CategoriesSection";
import { ListingsGrid } from "./home/ListingsGrid";
import { FeaturesSection } from "./home/FeaturesSection";
import { CTASection } from "./home/CTASection";

type ListingCard = {
  id: string;
  title: string;
  city: string | null;
  country: string;
  type: string;
  createdAt: Date;
  images: { id: string; url: string }[];
  priceFormatted: string;
  ownerName: string | null;
  maxGuests: number | null;
  beds: number | null;
  isInstantBook: boolean;
};

type Category = {
  key: string;
  label: string;
  icon: string;
  count: number;
};

type Stats = {
  totalListings: number;
  totalUsers: number;
  totalCountries: number;
};

type HomeClientProps = {
  cards: ListingCard[];
  categories: Category[];
  stats: Stats;
  translations: Record<string, unknown>;
  displayCurrency: string;
};

// Ordre des catégories les plus recherchées
const CATEGORY_ORDER = [
  "HOUSE", "APARTMENT", "PARKING", "ROOM", "GARAGE", "STORAGE",
  "OFFICE", "MEETING_ROOM", "COWORKING", "EVENT_SPACE", "RECORDING_STUDIO", "OTHER"
];

// Labels pour toutes les catégories
const CATEGORY_LABELS: Record<string, string> = {
  HOUSE: "Maison",
  APARTMENT: "Appartement",
  PARKING: "Parking",
  ROOM: "Chambre",
  GARAGE: "Garage",
  STORAGE: "Stockage",
  OFFICE: "Bureau",
  MEETING_ROOM: "Salle de réunion",
  COWORKING: "Coworking",
  EVENT_SPACE: "Événementiel",
  RECORDING_STUDIO: "Studios",
  OTHER: "Autre",
};

export default function HomeClient({ cards, categories }: HomeClientProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // Créer la liste complète des catégories triées
  const sortedCategories = CATEGORY_ORDER.map(key => {
    const existing = categories.find(c => c.key === key);
    return existing || { key, label: CATEGORY_LABELS[key] || key, icon: "", count: 0 };
  });

  // Context pour partager la SearchBar et les catégories avec la Navbar
  const {
    setSearchBarElement,
    setShowInNavbar,
    setCategories,
    activeCategory,
    setActiveCategory
  } = useSearchBar();

  // Ouvrir le modal si ?search=open dans l'URL
  useEffect(() => {
    if (searchParams.get("search") === "open") {
      setIsSearchModalOpen(true);
    }
  }, [searchParams]);

  // Écouter l'événement pour ouvrir le modal depuis la navbar
  useEffect(() => {
    const handleOpenSearchModal = () => setIsSearchModalOpen(true);
    window.addEventListener("openSearchModal", handleOpenSearchModal);
    return () => window.removeEventListener("openSearchModal", handleOpenSearchModal);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    // Envoyer les catégories au contexte
    setCategories(categories);
  }, [categories, setCategories]);

  // Synchroniser l'état du scroll avec le contexte pour la Navbar
  useEffect(() => {
    setShowInNavbar(isScrolled);
  }, [isScrolled, setShowInNavbar]);

  // Ne plus envoyer de SearchBar au contexte (elle est maintenant dans HomeClient)
  useEffect(() => {
    setSearchBarElement(null);
  }, [setSearchBarElement]);

  // Scroll detection pour la barre de recherche
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setIsScrolled(heroBottom < 80);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Premium Animation Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
          opacity: 0;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
      `}</style>

      {/* HERO SECTION */}
      <div ref={heroRef}>
        <HeroSection />
      </div>

      {/* SEARCH BAR - Sous le héro, disparaît quand scrollé */}
      <SearchBarSection
        isScrolled={isScrolled}
        onOpenModal={() => setIsSearchModalOpen(true)}
      />

      {/* CATEGORIES - Visible seulement quand pas scrollé */}
      <CategoriesSection
        isScrolled={isScrolled}
        categories={sortedCategories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* LISTINGS GRID */}
      <ListingsGrid
        cards={cards}
        categories={categories}
        activeCategory={activeCategory}
      />

      {/* DECORATIVE VISUAL SECTION */}
      <FeaturesSection />

      {/* CTA SECTION */}
      <CTASection isLoggedIn={isLoggedIn} />

      {/* SEARCH MODAL */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </main>
  );
}
