// apps/web/src/components/listings/CategoryFilters.tsx
"use client";

import { useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type CategoryFiltersState = {
  spaceType: string;
  // Communs
  minBedrooms: number;
  minBeds: number;
  minBathrooms: number;
  // Résidentiel (HOUSE, APARTMENT, ROOM, STUDIO)
  spaceSubtype: string;
  hasGarden: boolean;
  hasPool: boolean;
  hasTerrace: boolean;
  hasSpa: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  hasWifi: boolean;
  hasAC: boolean;
  hasHeating: boolean;
  hasTV: boolean;
  hasWasher: boolean;
  hasElevator: boolean;
  isAccessible: boolean;
  hasBBQ: boolean;
  selfCheckIn: boolean;
  childrenAllowed: boolean;
  // Pro (OFFICE, COWORKING, MEETING_ROOM)
  minDesks: number;
  hasProjector: boolean;
  hasWhiteboard: boolean;
  hasVideoConf: boolean;
  hasKitchen: boolean;
  hasReception: boolean;
  hasPrinter: boolean;
  hasHighSpeedInternet: boolean;
  hasConferencePhone: boolean;
  // Événementiel (EVENT_SPACE)
  minCapacity: number;
  hasCatering: boolean;
  hasStage: boolean;
  hasSoundSystem: boolean;
  hasLighting: boolean;
  eventsAllowed: boolean;
  // Studio enregistrement (RECORDING_STUDIO)
  hasSoundproofing: boolean;
  hasGreenScreen: boolean;
  hasMixingDesk: boolean;
  hasMicrophones: boolean;
  // Parking / Garage
  parkingCovered: boolean;
  parkingSecured: boolean;
  hasEVCharger: boolean;
  minParkingSpaces: number;
  // Stockage (STORAGE)
  storageClimatized: boolean;
  storageSecured: boolean;
  minStorageSize: number;
};

export const EMPTY_CATEGORY_FILTERS: CategoryFiltersState = {
  spaceType: "",
  minBedrooms: 0,
  minBeds: 0,
  minBathrooms: 0,
  spaceSubtype: "",
  hasGarden: false,
  hasPool: false,
  hasTerrace: false,
  hasSpa: false,
  petsAllowed: false,
  smokingAllowed: false,
  hasWifi: false,
  hasAC: false,
  hasHeating: false,
  hasTV: false,
  hasWasher: false,
  hasElevator: false,
  isAccessible: false,
  hasBBQ: false,
  selfCheckIn: false,
  childrenAllowed: false,
  minDesks: 0,
  hasProjector: false,
  hasWhiteboard: false,
  hasVideoConf: false,
  hasKitchen: false,
  hasReception: false,
  hasPrinter: false,
  hasHighSpeedInternet: false,
  hasConferencePhone: false,
  minCapacity: 0,
  hasCatering: false,
  hasStage: false,
  hasSoundSystem: false,
  hasLighting: false,
  eventsAllowed: false,
  hasSoundproofing: false,
  hasGreenScreen: false,
  hasMixingDesk: false,
  hasMicrophones: false,
  parkingCovered: false,
  parkingSecured: false,
  hasEVCharger: false,
  minParkingSpaces: 1,
  storageClimatized: false,
  storageSecured: false,
  minStorageSize: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Catégories
// ─────────────────────────────────────────────────────────────────────────────
const SPACE_TYPES = [
  { value: "HOUSE",           label: "Maison" },
  { value: "APARTMENT",       label: "Appartement" },
  { value: "ROOM",            label: "Chambre" },
  { value: "STUDIO",          label: "Studio" },
  { value: "OFFICE",          label: "Bureau" },
  { value: "COWORKING",       label: "Coworking" },
  { value: "MEETING_ROOM",    label: "Salle réunion" },
  { value: "EVENT_SPACE",     label: "Événementiel" },
  { value: "RECORDING_STUDIO",label: "Studio enreg." },
  { value: "PARKING",         label: "Parking" },
  { value: "GARAGE",          label: "Garage" },
  { value: "STORAGE",         label: "Stockage" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants utilitaires
// ─────────────────────────────────────────────────────────────────────────────
function ToggleChip({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-left text-xs font-medium transition-all duration-200 ${
        active
          ? "border-gray-700 bg-gray-100 text-gray-900 shadow-sm ring-1 ring-gray-700"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50"
      }`}
    >
      <span className="block">{label}</span>
      {sub && <span className="mt-0.5 block text-[10px] font-normal text-gray-400">{sub}</span>}
    </button>
  );
}

function CounterRow({
  label,
  sub,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  sub?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 disabled:opacity-30"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <span className="w-6 text-center text-sm font-semibold text-gray-900">
          {value === 0 ? "Peu importe" : `${value}+`}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 disabled:opacity-30"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </h4>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filtres spécifiques par catégorie
// ─────────────────────────────────────────────────────────────────────────────
function ResidentialFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Type de mise en location</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "ENTIRE_PLACE",  l: "Logement entier", s: "Tout le logement pour vous" },
            { v: "PRIVATE_ROOM",  l: "Chambre privee", s: "Votre chambre, espaces communs partages" },
            { v: "SHARED_ROOM",   l: "Chambre partagee", s: "Un espace partage avec d'autres" },
          ].map(({ v, l, s }) => (
            <ToggleChip key={v} active={f.spaceSubtype === v} onClick={() => set({ spaceSubtype: f.spaceSubtype === v ? "" : v })} label={l} sub={s} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Chambres, lits et salles de bain</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Chambres" sub="Nombre minimum de chambres" value={f.minBedrooms} onChange={(v) => set({ minBedrooms: v })} />
          <CounterRow label="Lits" sub="Nombre minimum de couchages" value={f.minBeds} onChange={(v) => set({ minBeds: v })} />
          <CounterRow label="Salles de bain" sub="Salles de bain ou d'eau" value={f.minBathrooms} onChange={(v) => set({ minBathrooms: v })} />
        </div>
      </div>

      <div>
        <SectionTitle>Equipements essentiels</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasWifi} onClick={() => set({ hasWifi: !f.hasWifi })} label="Wi-Fi" sub="Connexion internet incluse" />
          <ToggleChip active={f.hasAC} onClick={() => set({ hasAC: !f.hasAC })} label="Climatisation" sub="Air conditionne" />
          <ToggleChip active={f.hasHeating} onClick={() => set({ hasHeating: !f.hasHeating })} label="Chauffage" sub="Chauffage central ou electrique" />
          <ToggleChip active={f.hasTV} onClick={() => set({ hasTV: !f.hasTV })} label="Television" sub="TV ecran plat ou connectee" />
          <ToggleChip active={f.hasKitchen} onClick={() => set({ hasKitchen: !f.hasKitchen })} label="Cuisine equipee" sub="Four, plaques, frigo, ustensiles" />
          <ToggleChip active={f.hasWasher} onClick={() => set({ hasWasher: !f.hasWasher })} label="Lave-linge" sub="Machine a laver disponible" />
        </div>
      </div>

      <div>
        <SectionTitle>Exterieur et bien-etre</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasGarden} onClick={() => set({ hasGarden: !f.hasGarden })} label="Jardin" sub="Espace vert privatif" />
          <ToggleChip active={f.hasPool} onClick={() => set({ hasPool: !f.hasPool })} label="Piscine" sub="Privee ou partagee" />
          <ToggleChip active={f.hasTerrace} onClick={() => set({ hasTerrace: !f.hasTerrace })} label="Terrasse / Balcon" sub="Espace exterieur" />
          <ToggleChip active={f.hasSpa} onClick={() => set({ hasSpa: !f.hasSpa })} label="Spa / Jacuzzi" sub="Detente et bien-etre" />
          <ToggleChip active={f.hasBBQ} onClick={() => set({ hasBBQ: !f.hasBBQ })} label="Barbecue" sub="BBQ ou plancha exterieur" />
        </div>
      </div>

      <div>
        <SectionTitle>Accessibilite et acces</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasElevator} onClick={() => set({ hasElevator: !f.hasElevator })} label="Ascenseur" sub="Acces sans escaliers" />
          <ToggleChip active={f.isAccessible} onClick={() => set({ isAccessible: !f.isAccessible })} label="Accessible PMR" sub="Fauteuil roulant, mobilite reduite" />
          <ToggleChip active={f.selfCheckIn} onClick={() => set({ selfCheckIn: !f.selfCheckIn })} label="Arrivee autonome" sub="Boite a cles, digicode, serrure" />
          <ToggleChip active={f.parkingSecured} onClick={() => set({ parkingSecured: !f.parkingSecured })} label="Parking" sub="Place de stationnement incluse" />
        </div>
      </div>

      <div>
        <SectionTitle>Regles du logement</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.petsAllowed} onClick={() => set({ petsAllowed: !f.petsAllowed })} label="Animaux acceptes" sub="Chiens, chats..." />
          <ToggleChip active={f.smokingAllowed} onClick={() => set({ smokingAllowed: !f.smokingAllowed })} label="Fumeurs acceptes" sub="Fumer autorise a l'interieur" />
          <ToggleChip active={f.childrenAllowed} onClick={() => set({ childrenAllowed: !f.childrenAllowed })} label="Enfants bienvenus" sub="Adapte aux familles" />
        </div>
      </div>
    </div>
  );
}

function StudioFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Configuration du studio</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Lits / couchages" sub="Canape-lit, mezzanine..." value={f.minBeds} onChange={(v) => set({ minBeds: v })} />
          <CounterRow label="Salles de bain" sub="Salle d'eau ou salle de bain" value={f.minBathrooms} onChange={(v) => set({ minBathrooms: v })} />
        </div>
      </div>

      <div>
        <SectionTitle>Equipements essentiels</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasWifi} onClick={() => set({ hasWifi: !f.hasWifi })} label="Wi-Fi" sub="Connexion internet incluse" />
          <ToggleChip active={f.hasKitchen} onClick={() => set({ hasKitchen: !f.hasKitchen })} label="Kitchenette" sub="Plaque, frigo, micro-ondes" />
          <ToggleChip active={f.hasAC} onClick={() => set({ hasAC: !f.hasAC })} label="Climatisation" sub="Air conditionne" />
          <ToggleChip active={f.hasHeating} onClick={() => set({ hasHeating: !f.hasHeating })} label="Chauffage" sub="Chauffage central ou electrique" />
          <ToggleChip active={f.hasTV} onClick={() => set({ hasTV: !f.hasTV })} label="Television" sub="TV ecran plat ou connectee" />
          <ToggleChip active={f.hasWasher} onClick={() => set({ hasWasher: !f.hasWasher })} label="Lave-linge" sub="Machine a laver disponible" />
        </div>
      </div>

      <div>
        <SectionTitle>Confort et exterieur</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasTerrace} onClick={() => set({ hasTerrace: !f.hasTerrace })} label="Balcon / terrasse" sub="Espace exterieur privatif" />
          <ToggleChip active={f.hasSpa} onClick={() => set({ hasSpa: !f.hasSpa })} label="Baignoire" sub="Baignoire dans la salle de bain" />
          <ToggleChip active={f.hasElevator} onClick={() => set({ hasElevator: !f.hasElevator })} label="Ascenseur" sub="Acces sans escaliers" />
          <ToggleChip active={f.selfCheckIn} onClick={() => set({ selfCheckIn: !f.selfCheckIn })} label="Arrivee autonome" sub="Boite a cles, digicode" />
        </div>
      </div>

      <div>
        <SectionTitle>Regles</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.petsAllowed} onClick={() => set({ petsAllowed: !f.petsAllowed })} label="Animaux acceptes" sub="Chiens, chats..." />
          <ToggleChip active={f.smokingAllowed} onClick={() => set({ smokingAllowed: !f.smokingAllowed })} label="Fumeurs acceptes" sub="Fumer autorise a l'interieur" />
          <ToggleChip active={f.childrenAllowed} onClick={() => set({ childrenAllowed: !f.childrenAllowed })} label="Enfants bienvenus" sub="Adapte aux familles" />
        </div>
      </div>
    </div>
  );
}

function RoomFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Type de chambre</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "PRIVATE_ROOM",  l: "Chambre privee", s: "Votre chambre, espaces communs partages" },
            { v: "SHARED_ROOM",   l: "Chambre partagee", s: "Dortoir ou chambre a plusieurs" },
          ].map(({ v, l, s }) => (
            <ToggleChip key={v} active={f.spaceSubtype === v} onClick={() => set({ spaceSubtype: f.spaceSubtype === v ? "" : v })} label={l} sub={s} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Couchages</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Lits" sub="Nombre de couchages dans la chambre" value={f.minBeds} onChange={(v) => set({ minBeds: v })} />
        </div>
      </div>

      <div>
        <SectionTitle>Equipements de la chambre</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasWifi} onClick={() => set({ hasWifi: !f.hasWifi })} label="Wi-Fi" sub="Connexion internet incluse" />
          <ToggleChip active={f.hasAC} onClick={() => set({ hasAC: !f.hasAC })} label="Climatisation" sub="Air conditionne" />
          <ToggleChip active={f.hasHeating} onClick={() => set({ hasHeating: !f.hasHeating })} label="Chauffage" sub="Chauffage dans la chambre" />
          <ToggleChip active={f.hasTV} onClick={() => set({ hasTV: !f.hasTV })} label="Television" sub="TV dans la chambre" />
        </div>
      </div>

      <div>
        <SectionTitle>Confort et acces</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasSpa} onClick={() => set({ hasSpa: !f.hasSpa })} label="Salle de bain privee" sub="Non partagee avec d'autres" />
          <ToggleChip active={f.hasKitchen} onClick={() => set({ hasKitchen: !f.hasKitchen })} label="Acces cuisine" sub="Cuisine partagee ou privee" />
          <ToggleChip active={f.hasTerrace} onClick={() => set({ hasTerrace: !f.hasTerrace })} label="Balcon / vue" sub="Espace exterieur ou belle vue" />
          <ToggleChip active={f.selfCheckIn} onClick={() => set({ selfCheckIn: !f.selfCheckIn })} label="Arrivee autonome" sub="Boite a cles, digicode" />
        </div>
      </div>

      <div>
        <SectionTitle>Regles</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.petsAllowed} onClick={() => set({ petsAllowed: !f.petsAllowed })} label="Animaux acceptes" sub="Chiens, chats..." />
          <ToggleChip active={f.smokingAllowed} onClick={() => set({ smokingAllowed: !f.smokingAllowed })} label="Fumeurs acceptes" sub="Fumer autorise a l'interieur" />
        </div>
      </div>
    </div>
  );
}

function OfficeFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Espace de travail</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Bureaux / postes" sub="Nombre minimum de places assises" value={f.minDesks} onChange={(v) => set({ minDesks: v })} />
          <CounterRow label="Salles de reunion" sub="Salles privees disponibles" value={f.minBedrooms} onChange={(v) => set({ minBedrooms: v })} />
          <CounterRow label="Sanitaires" sub="Toilettes et salles d'eau" value={f.minBathrooms} onChange={(v) => set({ minBathrooms: v })} />
        </div>
      </div>

      <div>
        <SectionTitle>Equipements bureautiques</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasHighSpeedInternet} onClick={() => set({ hasHighSpeedInternet: !f.hasHighSpeedInternet })} label="Internet haut debit" sub="Fibre ou connexion rapide" />
          <ToggleChip active={f.hasProjector} onClick={() => set({ hasProjector: !f.hasProjector })} label="Projecteur / ecran" sub="Presentations et reunions" />
          <ToggleChip active={f.hasWhiteboard} onClick={() => set({ hasWhiteboard: !f.hasWhiteboard })} label="Tableau blanc" sub="Brainstorming et schemas" />
          <ToggleChip active={f.hasVideoConf} onClick={() => set({ hasVideoConf: !f.hasVideoConf })} label="Visioconference" sub="Camera, micro, ecran" />
          <ToggleChip active={f.hasPrinter} onClick={() => set({ hasPrinter: !f.hasPrinter })} label="Imprimante / scanner" sub="Impression sur place" />
          <ToggleChip active={f.hasConferencePhone} onClick={() => set({ hasConferencePhone: !f.hasConferencePhone })} label="Telephone conference" sub="Appels mains libres" />
        </div>
      </div>

      <div>
        <SectionTitle>Services et confort</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasKitchen} onClick={() => set({ hasKitchen: !f.hasKitchen })} label="Cuisine / cafe" sub="Espace pause et boissons" />
          <ToggleChip active={f.hasReception} onClick={() => set({ hasReception: !f.hasReception })} label="Accueil / reception" sub="Hall d'entree avec accueil" />
          <ToggleChip active={f.hasAC} onClick={() => set({ hasAC: !f.hasAC })} label="Climatisation" sub="Air conditionne" />
          <ToggleChip active={f.hasElevator} onClick={() => set({ hasElevator: !f.hasElevator })} label="Ascenseur" sub="Acces sans escaliers" />
          <ToggleChip active={f.isAccessible} onClick={() => set({ isAccessible: !f.isAccessible })} label="Accessible PMR" sub="Fauteuil roulant, mobilite reduite" />
          <ToggleChip active={f.parkingSecured} onClick={() => set({ parkingSecured: !f.parkingSecured })} label="Parking inclus" sub="Places de stationnement" />
        </div>
      </div>
    </div>
  );
}

function CoworkingFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Type d&apos;espace coworking</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "OPEN_SPACE",    l: "Open space", s: "Bureau partage en espace ouvert" },
            { v: "PRIVATE_ROOM",  l: "Bureau prive", s: "Bureau ferme pour vous ou votre equipe" },
            { v: "SHARED_ROOM",   l: "Poste nomade", s: "Place flexible, premier arrive" },
          ].map(({ v, l, s }) => (
            <ToggleChip key={v} active={f.spaceSubtype === v} onClick={() => set({ spaceSubtype: f.spaceSubtype === v ? "" : v })} label={l} sub={s} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Capacite</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Postes de travail" sub="Nombre minimum de places" value={f.minDesks} onChange={(v) => set({ minDesks: v })} />
        </div>
      </div>

      <div>
        <SectionTitle>Equipements</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasHighSpeedInternet} onClick={() => set({ hasHighSpeedInternet: !f.hasHighSpeedInternet })} label="Internet haut debit" sub="Fibre ou connexion rapide" />
          <ToggleChip active={f.hasPrinter} onClick={() => set({ hasPrinter: !f.hasPrinter })} label="Imprimante / scanner" sub="Impression et scan disponibles" />
          <ToggleChip active={f.hasVideoConf} onClick={() => set({ hasVideoConf: !f.hasVideoConf })} label="Salles de visio" sub="Cabines d'appel ou salles" />
          <ToggleChip active={f.hasWhiteboard} onClick={() => set({ hasWhiteboard: !f.hasWhiteboard })} label="Tableau blanc" sub="Espaces de brainstorming" />
          <ToggleChip active={f.hasConferencePhone} onClick={() => set({ hasConferencePhone: !f.hasConferencePhone })} label="Telephone conference" sub="Appels mains libres" />
        </div>
      </div>

      <div>
        <SectionTitle>Services et confort</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasKitchen} onClick={() => set({ hasKitchen: !f.hasKitchen })} label="Cuisine / cafe" sub="Espace detente et boissons" />
          <ToggleChip active={f.hasReception} onClick={() => set({ hasReception: !f.hasReception })} label="Accueil / concierge" sub="Service d'accueil sur place" />
          <ToggleChip active={f.hasAC} onClick={() => set({ hasAC: !f.hasAC })} label="Climatisation" sub="Air conditionne" />
          <ToggleChip active={f.hasElevator} onClick={() => set({ hasElevator: !f.hasElevator })} label="Ascenseur" sub="Acces sans escaliers" />
          <ToggleChip active={f.isAccessible} onClick={() => set({ isAccessible: !f.isAccessible })} label="Accessible PMR" sub="Fauteuil roulant, mobilite reduite" />
          <ToggleChip active={f.parkingSecured} onClick={() => set({ parkingSecured: !f.parkingSecured })} label="Parking" sub="Places de stationnement" />
          <ToggleChip active={f.hasTerrace} onClick={() => set({ hasTerrace: !f.hasTerrace })} label="Terrasse / rooftop" sub="Espace exterieur detente" />
          <ToggleChip active={f.petsAllowed} onClick={() => set({ petsAllowed: !f.petsAllowed })} label="Pet-friendly" sub="Animaux acceptes dans l'espace" />
        </div>
      </div>
    </div>
  );
}

function MeetingFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Capacite de la salle</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Personnes" sub="Nombre minimum de places" value={f.minCapacity} onChange={(v) => set({ minCapacity: v })} max={200} />
          <CounterRow label="Postes de travail" sub="Tables et chaises equipees" value={f.minDesks} onChange={(v) => set({ minDesks: v })} />
        </div>
      </div>

      <div>
        <SectionTitle>Equipements de reunion</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasProjector} onClick={() => set({ hasProjector: !f.hasProjector })} label="Projecteur / ecran" sub="Grand ecran ou videoprojecteur" />
          <ToggleChip active={f.hasWhiteboard} onClick={() => set({ hasWhiteboard: !f.hasWhiteboard })} label="Tableau blanc" sub="Marqueurs fournis" />
          <ToggleChip active={f.hasVideoConf} onClick={() => set({ hasVideoConf: !f.hasVideoConf })} label="Visioconference" sub="Webcam, micro, haut-parleur" />
          <ToggleChip active={f.hasConferencePhone} onClick={() => set({ hasConferencePhone: !f.hasConferencePhone })} label="Telephone conference" sub="Appels mains libres" />
          <ToggleChip active={f.hasHighSpeedInternet} onClick={() => set({ hasHighSpeedInternet: !f.hasHighSpeedInternet })} label="Internet haut debit" sub="Fibre ou connexion rapide" />
          <ToggleChip active={f.hasSoundproofing} onClick={() => set({ hasSoundproofing: !f.hasSoundproofing })} label="Insonorisation" sub="Salle calme et isolee" />
        </div>
      </div>

      <div>
        <SectionTitle>Services et confort</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasKitchen} onClick={() => set({ hasKitchen: !f.hasKitchen })} label="Cafe / collations" sub="Machine a cafe, eau, snacks" />
          <ToggleChip active={f.hasReception} onClick={() => set({ hasReception: !f.hasReception })} label="Accueil visiteurs" sub="Reception et orientation" />
          <ToggleChip active={f.hasAC} onClick={() => set({ hasAC: !f.hasAC })} label="Climatisation" sub="Air conditionne" />
          <ToggleChip active={f.isAccessible} onClick={() => set({ isAccessible: !f.isAccessible })} label="Accessible PMR" sub="Fauteuil roulant, mobilite reduite" />
          <ToggleChip active={f.parkingSecured} onClick={() => set({ parkingSecured: !f.parkingSecured })} label="Parking" sub="Places de stationnement" />
        </div>
      </div>
    </div>
  );
}

function EventFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Capacite d&apos;accueil</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Personnes" sub="Capacite maximale de l'espace" value={f.minCapacity} onChange={(v) => set({ minCapacity: v })} max={2000} />
        </div>
      </div>

      <div>
        <SectionTitle>Equipements evenementiels</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasStage} onClick={() => set({ hasStage: !f.hasStage })} label="Scene / podium" sub="Estrade ou scene surélevee" />
          <ToggleChip active={f.hasSoundSystem} onClick={() => set({ hasSoundSystem: !f.hasSoundSystem })} label="Systeme son" sub="Enceintes, ampli, micro" />
          <ToggleChip active={f.hasLighting} onClick={() => set({ hasLighting: !f.hasLighting })} label="Eclairage scenique" sub="Spots, jeux de lumiere" />
          <ToggleChip active={f.hasCatering} onClick={() => set({ hasCatering: !f.hasCatering })} label="Traiteur / cuisine" sub="Cuisine equipee ou traiteur" />
          <ToggleChip active={f.hasProjector} onClick={() => set({ hasProjector: !f.hasProjector })} label="Projecteur / ecran" sub="Videoprojecteur grand format" />
          <ToggleChip active={f.hasVideoConf} onClick={() => set({ hasVideoConf: !f.hasVideoConf })} label="Diffusion live" sub="Streaming et captation video" />
          <ToggleChip active={f.hasSoundproofing} onClick={() => set({ hasSoundproofing: !f.hasSoundproofing })} label="Insonorisation" sub="Isolation phonique" />
          <ToggleChip active={f.hasReception} onClick={() => set({ hasReception: !f.hasReception })} label="Vestiaire / accueil" sub="Espace d'accueil invites" />
        </div>
      </div>

      <div>
        <SectionTitle>Services et confort</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasAC} onClick={() => set({ hasAC: !f.hasAC })} label="Climatisation" sub="Air conditionne" />
          <ToggleChip active={f.hasElevator} onClick={() => set({ hasElevator: !f.hasElevator })} label="Ascenseur" sub="Acces sans escaliers" />
          <ToggleChip active={f.isAccessible} onClick={() => set({ isAccessible: !f.isAccessible })} label="Accessible PMR" sub="Fauteuil roulant, mobilite reduite" />
          <ToggleChip active={f.parkingSecured} onClick={() => set({ parkingSecured: !f.parkingSecured })} label="Parking" sub="Places de stationnement" />
          <ToggleChip active={f.eventsAllowed} onClick={() => set({ eventsAllowed: !f.eventsAllowed })} label="Evenements autorises" sub="Fetes, mariages, concerts..." />
          <ToggleChip active={f.childrenAllowed} onClick={() => set({ childrenAllowed: !f.childrenAllowed })} label="Enfants bienvenus" sub="Adapte aux familles" />
        </div>
      </div>
    </div>
  );
}

function RecordingFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Equipements studio</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.hasSoundproofing} onClick={() => set({ hasSoundproofing: !f.hasSoundproofing })} label="Insonorisation" sub="Traitement acoustique pro" />
          <ToggleChip active={f.hasMixingDesk} onClick={() => set({ hasMixingDesk: !f.hasMixingDesk })} label="Table de mixage" sub="Console analogique ou numerique" />
          <ToggleChip active={f.hasMicrophones} onClick={() => set({ hasMicrophones: !f.hasMicrophones })} label="Microphones pro" sub="Condensateur, dynamique..." />
          <ToggleChip active={f.hasGreenScreen} onClick={() => set({ hasGreenScreen: !f.hasGreenScreen })} label="Fond vert" sub="Incrustation video" />
          <ToggleChip active={f.hasLighting} onClick={() => set({ hasLighting: !f.hasLighting })} label="Eclairage studio" sub="Softbox, ring light, spots" />
          <ToggleChip active={f.hasVideoConf} onClick={() => set({ hasVideoConf: !f.hasVideoConf })} label="Cabine regie" sub="Monitoring et controle separe" />
        </div>
      </div>
    </div>
  );
}

function ParkingFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Places disponibles</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Nombre de places" sub="Places de stationnement minimum" value={f.minParkingSpaces} onChange={(v) => set({ minParkingSpaces: v })} min={1} max={50} />
        </div>
      </div>

      <div>
        <SectionTitle>Type de parking</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "OUTDOOR",   l: "Exterieur", s: "Place en plein air" },
            { v: "UNDERGROUND", l: "Souterrain", s: "Parking en sous-sol" },
            { v: "MULTI_STORY", l: "En etage", s: "Parking a etages" },
          ].map(({ v, l, s }) => (
            <ToggleChip key={v} active={f.spaceSubtype === v} onClick={() => set({ spaceSubtype: f.spaceSubtype === v ? "" : v })} label={l} sub={s} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Caracteristiques</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.parkingCovered} onClick={() => set({ parkingCovered: !f.parkingCovered })} label="Couvert" sub="A l'abri des intemperies" />
          <ToggleChip active={f.parkingSecured} onClick={() => set({ parkingSecured: !f.parkingSecured })} label="Securise / garde" sub="Cameras, badge, gardien" />
          <ToggleChip active={f.hasEVCharger} onClick={() => set({ hasEVCharger: !f.hasEVCharger })} label="Borne electrique" sub="Recharge vehicule electrique" />
          <ToggleChip active={f.hasLighting} onClick={() => set({ hasLighting: !f.hasLighting })} label="Eclaire" sub="Eclairage permanent la nuit" />
        </div>
      </div>
    </div>
  );
}

function GarageFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Type d&apos;utilisation</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "VEHICLE_STORAGE", l: "Stockage vehicule", s: "Voiture, moto, velo" },
            { v: "WORKSHOP",        l: "Atelier / bricolage", s: "Espace de travail manuel" },
            { v: "MIXED",           l: "Mixte", s: "Stockage + espace de travail" },
          ].map(({ v, l, s }) => (
            <ToggleChip key={v} active={f.spaceSubtype === v} onClick={() => set({ spaceSubtype: f.spaceSubtype === v ? "" : v })} label={l} sub={s} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Dimensions et capacite</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Surface (m2)" sub="Superficie minimum du garage" value={f.minStorageSize} onChange={(v) => set({ minStorageSize: v })} max={500} />
          <CounterRow label="Vehicules" sub="Nombre de vehicules stockables" value={f.minParkingSpaces} onChange={(v) => set({ minParkingSpaces: v })} min={1} max={10} />
        </div>
      </div>

      <div>
        <SectionTitle>Caracteristiques</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.parkingSecured} onClick={() => set({ parkingSecured: !f.parkingSecured })} label="Securise" sub="Serrure, alarme, cameras" />
          <ToggleChip active={f.hasEVCharger} onClick={() => set({ hasEVCharger: !f.hasEVCharger })} label="Prise electrique" sub="Alimentation pour outils ou recharge" />
          <ToggleChip active={f.hasLighting} onClick={() => set({ hasLighting: !f.hasLighting })} label="Eclaire" sub="Eclairage interieur" />
          <ToggleChip active={f.storageClimatized} onClick={() => set({ storageClimatized: !f.storageClimatized })} label="Isole / chauffe" sub="Protection contre le froid" />
        </div>
      </div>
    </div>
  );
}

function StorageFilters({
  f,
  set,
}: {
  f: CategoryFiltersState;
  set: (patch: Partial<CategoryFiltersState>) => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <SectionTitle>Surface minimale</SectionTitle>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-1">
          <CounterRow label="Surface (m2)" sub="Superficie minimum requise" value={f.minStorageSize} onChange={(v) => set({ minStorageSize: v })} max={500} />
        </div>
      </div>

      <div>
        <SectionTitle>Caracteristiques du stockage</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ToggleChip active={f.storageClimatized} onClick={() => set({ storageClimatized: !f.storageClimatized })} label="Climatise" sub="Temperature et humidite controlees" />
          <ToggleChip active={f.storageSecured} onClick={() => set({ storageSecured: !f.storageSecured })} label="Securise / alarme" sub="Acces restreint, cameras, alarme" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal exporté
// ─────────────────────────────────────────────────────────────────────────────
type CategoryFiltersProps = {
  filters: CategoryFiltersState;
  onChange: (patch: Partial<CategoryFiltersState>) => void;
};

export default function CategoryFilters({ filters, onChange }: CategoryFiltersProps) {
  const [animating, setAnimating] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    const next = filters.spaceType === value ? "" : value;
    if (next && next !== filters.spaceType) {
      setAnimating(next);
      setTimeout(() => setAnimating(null), 2000);
    }
    onChange({ spaceType: next });
  };

  const specificFilters = () => {
    const t = filters.spaceType;
    if (t === "HOUSE" || t === "APARTMENT")
      return <ResidentialFilters f={filters} set={onChange} />;
    if (t === "ROOM")
      return <RoomFilters f={filters} set={onChange} />;
    if (t === "STUDIO")
      return <StudioFilters f={filters} set={onChange} />;
    if (t === "OFFICE")
      return <OfficeFilters f={filters} set={onChange} />;
    if (t === "COWORKING")
      return <CoworkingFilters f={filters} set={onChange} />;
    if (t === "MEETING_ROOM")
      return <MeetingFilters f={filters} set={onChange} />;
    if (t === "EVENT_SPACE")
      return <EventFilters f={filters} set={onChange} />;
    if (t === "RECORDING_STUDIO")
      return <RecordingFilters f={filters} set={onChange} />;
    if (t === "PARKING")
      return <ParkingFilters f={filters} set={onChange} />;
    if (t === "GARAGE")
      return <GarageFilters f={filters} set={onChange} />;
    if (t === "STORAGE")
      return <StorageFilters f={filters} set={onChange} />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Grille de sélection du type */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-gray-900">Type d&apos;espace</h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {SPACE_TYPES.map((item) => {
            const isActive = filters.spaceType === item.value;
            const isAnim = animating === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleSelect(item.value)}
                className={`group flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all duration-200 ${
                  isActive
                    ? "border-gray-800 bg-gray-100 text-gray-900 shadow-md ring-1 ring-gray-800 scale-[1.03]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 hover:scale-[1.02]"
                }`}
              >
                {/* Icône animée — même composant que la page d'accueil */}
                <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                  <CategoryIcon
                    category={item.value}
                    isActive={isActive}
                    isAnimating={isAnim}
                  />
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres spécifiques à la catégorie — apparaissent avec animation */}
      {filters.spaceType && (
        <div
          key={filters.spaceType}
          className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 transition-all duration-300"
          style={{ animation: "fadeSlideIn 0.25s ease-out" }}
        >
          {specificFilters()}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
