// Illustrations SVG pour les villes - Style Airbnb
// Chaque illustration représente un monument emblématique reconnaissable de la ville

import React from "react";

type CityIllustrationProps = {
  className?: string;
};

// ═══════════════════════════════════════════════════════════════════════════════
// FRANCE
// ═══════════════════════════════════════════════════════════════════════════════

// Paris - Tour Eiffel (forme iconique reconnaissable)
export const ParisIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FEF3C7"/>
    {/* Base de la tour */}
    <path d="M18 54H26L28 48H36L38 54H46" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Pieds de la tour avec arches */}
    <path d="M22 54L26 42" stroke="#B45309" strokeWidth="2.5"/>
    <path d="M42 54L38 42" stroke="#B45309" strokeWidth="2.5"/>
    {/* Arche du premier niveau */}
    <path d="M26 42C26 42 32 46 38 42" stroke="#B45309" strokeWidth="2"/>
    {/* Corps principal */}
    <path d="M26 42L29 32H35L38 42" stroke="#B45309" strokeWidth="2"/>
    {/* Premier balcon */}
    <path d="M24 42H40" stroke="#92400E" strokeWidth="2"/>
    {/* Deuxième section */}
    <path d="M29 32L30.5 24H33.5L35 32" stroke="#B45309" strokeWidth="2"/>
    {/* Deuxième balcon */}
    <path d="M27 32H37" stroke="#92400E" strokeWidth="1.5"/>
    {/* Section supérieure */}
    <path d="M30.5 24L31.5 16H32.5L33.5 24" stroke="#B45309" strokeWidth="1.5"/>
    {/* Troisième balcon */}
    <path d="M29 24H35" stroke="#92400E" strokeWidth="1.5"/>
    {/* Flèche au sommet */}
    <path d="M32 16V10" stroke="#B45309" strokeWidth="2"/>
    <circle cx="32" cy="9" r="1.5" fill="#F59E0B"/>
    {/* Détails croisillons */}
    <path d="M27 38L37 38M28 35L36 35" stroke="#D97706" strokeWidth="0.75" opacity="0.6"/>
  </svg>
);

// Lyon - Basilique Notre-Dame de Fourvière (4 tours caractéristiques)
export const LyonIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#EDE9FE"/>
    {/* Colline de Fourvière */}
    <ellipse cx="32" cy="52" rx="24" ry="6" fill="#C4B5FD"/>
    {/* Corps principal de la basilique */}
    <rect x="20" y="32" width="24" height="16" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.5"/>
    {/* Les 4 tours */}
    <rect x="18" y="22" width="6" height="26" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.5"/>
    <rect x="40" y="22" width="6" height="26" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.5"/>
    {/* Toits des tours */}
    <path d="M18 22L21 14L24 22" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="1"/>
    <path d="M40 22L43 14L46 22" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="1"/>
    {/* Clocher central */}
    <rect x="29" y="20" width="6" height="12" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1"/>
    <path d="M29 20L32 12L35 20" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="1"/>
    {/* Statue de Marie au sommet */}
    <ellipse cx="32" cy="11" rx="1.5" ry="2" fill="#FCD34D"/>
    {/* Fenêtres */}
    <circle cx="26" cy="38" r="2" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="0.75"/>
    <circle cx="38" cy="38" r="2" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="0.75"/>
    {/* Porte centrale */}
    <path d="M29 48V42C29 40.5 30.5 40 32 40C33.5 40 35 40.5 35 42V48" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="1"/>
  </svg>
);

// Bordeaux - Place de la Bourse avec Miroir d'eau
export const BordeauxIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FEF2F2"/>
    {/* Miroir d'eau */}
    <ellipse cx="32" cy="52" rx="22" ry="4" fill="#BFDBFE"/>
    <ellipse cx="32" cy="52" rx="18" ry="2.5" fill="#93C5FD" opacity="0.5"/>
    {/* Bâtiment central - Place de la Bourse */}
    <rect x="22" y="28" width="20" height="20" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5"/>
    {/* Toit mansardé */}
    <path d="M20 28L24 20H40L44 28" fill="#1F2937" stroke="#111827" strokeWidth="1"/>
    {/* Fronton central */}
    <path d="M28 28L32 22L36 28" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1"/>
    {/* Colonnes */}
    <rect x="25" y="32" width="2" height="14" fill="#FECACA" stroke="#DC2626" strokeWidth="0.5"/>
    <rect x="31" y="32" width="2" height="14" fill="#FECACA" stroke="#DC2626" strokeWidth="0.5"/>
    <rect x="37" y="32" width="2" height="14" fill="#FECACA" stroke="#DC2626" strokeWidth="0.5"/>
    {/* Fenêtres */}
    <rect x="26" y="30" width="3" height="4" fill="#FEF2F2" stroke="#DC2626" strokeWidth="0.5"/>
    <rect x="35" y="30" width="3" height="4" fill="#FEF2F2" stroke="#DC2626" strokeWidth="0.5"/>
    {/* Arcades */}
    <path d="M24 48C24 44 26 42 28 42" stroke="#DC2626" strokeWidth="1"/>
    <path d="M40 48C40 44 38 42 36 42" stroke="#DC2626" strokeWidth="1"/>
    {/* Reflet */}
    <rect x="26" y="50" width="12" height="4" fill="#DC2626" opacity="0.15"/>
  </svg>
);

// Nice - Promenade des Anglais avec palmier et mer
export const NiceIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#ECFEFF"/>
    {/* Ciel et soleil */}
    <circle cx="50" cy="14" r="6" fill="#FBBF24"/>
    <circle cx="50" cy="14" r="4" fill="#FCD34D"/>
    {/* Mer Méditerranée */}
    <path d="M0 40C10 38 20 42 32 40C44 38 54 42 64 40V56H0V40Z" fill="#0EA5E9"/>
    <path d="M0 44C10 42 20 46 32 44C44 42 54 46 64 44V56H0V44Z" fill="#0284C7"/>
    {/* Plage / Promenade */}
    <rect x="0" y="48" width="64" height="8" fill="#FDE68A"/>
    <rect x="0" y="48" width="64" height="3" fill="#E5E7EB"/>
    {/* Palmier - tronc */}
    <path d="M20 52C20 52 18 42 22 32" stroke="#854D0E" strokeWidth="3" strokeLinecap="round"/>
    {/* Feuilles de palmier */}
    <path d="M22 32C22 32 10 28 6 34" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 32C22 32 12 24 10 30" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 32C22 32 16 20 16 26" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M22 32C22 32 28 20 30 26" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"/>
    <path d="M22 32C22 32 34 24 36 30" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 32C22 32 36 28 40 34" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Chaise bleue typique */}
    <ellipse cx="48" cy="52" rx="6" ry="3" fill="#3B82F6"/>
    <path d="M44 52L44 48L52 48L52 52" stroke="#2563EB" strokeWidth="1.5"/>
  </svg>
);

// Marseille - Notre-Dame de la Garde (Bonne Mère)
export const MarseilleIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#F0F9FF"/>
    {/* Mer */}
    <path d="M0 50C16 48 32 52 48 50C56 49 60 50 64 50V64H0V50Z" fill="#0EA5E9"/>
    {/* Colline */}
    <ellipse cx="32" cy="52" rx="26" ry="10" fill="#D1FAE5"/>
    {/* Basilique - base */}
    <rect x="24" y="32" width="16" height="18" fill="#F8FAFC" stroke="#0369A1" strokeWidth="1.5"/>
    {/* Clocher */}
    <rect x="29" y="14" width="6" height="18" fill="#F8FAFC" stroke="#0369A1" strokeWidth="1.5"/>
    {/* Toit du clocher */}
    <path d="M29 14L32 8L35 14" fill="#0EA5E9" stroke="#0369A1" strokeWidth="1"/>
    {/* Statue dorée de la Vierge */}
    <ellipse cx="32" cy="7" rx="1.5" ry="2.5" fill="#FCD34D" stroke="#F59E0B" strokeWidth="0.5"/>
    <circle cx="32" cy="5" r="1" fill="#FCD34D"/>
    {/* Rayons dorés */}
    <path d="M32 4L32 2M30 5L28 3M34 5L36 3" stroke="#FCD34D" strokeWidth="0.75" strokeLinecap="round"/>
    {/* Fenêtres de la basilique */}
    <rect x="27" y="36" width="4" height="6" rx="2" fill="#BAE6FD" stroke="#0369A1" strokeWidth="0.75"/>
    <rect x="33" y="36" width="4" height="6" rx="2" fill="#BAE6FD" stroke="#0369A1" strokeWidth="0.75"/>
    {/* Porte */}
    <path d="M29 50V45C29 43.5 30.5 42 32 42C33.5 42 35 43.5 35 45V50" fill="#0369A1"/>
    {/* Rayures du clocher */}
    <path d="M29 18H35M29 22H35M29 26H35" stroke="#0369A1" strokeWidth="0.5" opacity="0.5"/>
  </svg>
);

// Toulouse - Le Capitole (bâtiment rose en briques)
export const ToulouseIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FFF1F2"/>
    {/* Place du Capitole */}
    <rect x="8" y="48" width="48" height="8" fill="#FEE2E2"/>
    {/* Bâtiment principal - briques roses */}
    <rect x="10" y="26" width="44" height="22" fill="#FDA4AF" stroke="#BE123C" strokeWidth="1.5"/>
    {/* Colonnes néoclassiques */}
    <rect x="14" y="30" width="2" height="16" fill="#FFF1F2" stroke="#BE123C" strokeWidth="0.5"/>
    <rect x="20" y="30" width="2" height="16" fill="#FFF1F2" stroke="#BE123C" strokeWidth="0.5"/>
    <rect x="26" y="30" width="2" height="16" fill="#FFF1F2" stroke="#BE123C" strokeWidth="0.5"/>
    <rect x="36" y="30" width="2" height="16" fill="#FFF1F2" stroke="#BE123C" strokeWidth="0.5"/>
    <rect x="42" y="30" width="2" height="16" fill="#FFF1F2" stroke="#BE123C" strokeWidth="0.5"/>
    <rect x="48" y="30" width="2" height="16" fill="#FFF1F2" stroke="#BE123C" strokeWidth="0.5"/>
    {/* Entablement */}
    <rect x="10" y="26" width="44" height="4" fill="#FECDD3" stroke="#BE123C" strokeWidth="1"/>
    {/* Fronton central avec croix occitane */}
    <path d="M26 26L32 18L38 26" fill="#FECDD3" stroke="#BE123C" strokeWidth="1"/>
    <circle cx="32" cy="22" r="2" fill="#FCD34D" stroke="#BE123C" strokeWidth="0.5"/>
    {/* Fenêtres à arcades */}
    <path d="M30 38C30 36 31 34 32 34C33 34 34 36 34 38V46H30V38Z" fill="#FFF1F2" stroke="#BE123C" strokeWidth="0.75"/>
    {/* Horloge */}
    <circle cx="32" cy="30" r="2" fill="#FFF1F2" stroke="#BE123C" strokeWidth="0.5"/>
    <path d="M32 29V30.5L33 31" stroke="#BE123C" strokeWidth="0.5"/>
  </svg>
);

// Nantes - L'Éléphant des Machines de l'île
export const NantesIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#F0FDF4"/>
    {/* Sol industriel */}
    <rect x="8" y="50" width="48" height="6" fill="#D1D5DB"/>
    {/* Corps de l'éléphant mécanique */}
    <ellipse cx="32" cy="36" rx="14" ry="10" fill="#6B7280" stroke="#374151" strokeWidth="1.5"/>
    {/* Texture mécanique du corps */}
    <path d="M22 32H42M22 36H42M22 40H42" stroke="#4B5563" strokeWidth="0.5" opacity="0.5"/>
    <circle cx="26" cy="36" r="2" fill="#9CA3AF" stroke="#374151" strokeWidth="0.5"/>
    <circle cx="38" cy="36" r="2" fill="#9CA3AF" stroke="#374151" strokeWidth="0.5"/>
    {/* Tête */}
    <ellipse cx="20" cy="28" rx="8" ry="6" fill="#6B7280" stroke="#374151" strokeWidth="1.5"/>
    {/* Oreille */}
    <ellipse cx="14" cy="26" rx="4" ry="6" fill="#9CA3AF" stroke="#374151" strokeWidth="1"/>
    {/* Trompe articulée */}
    <path d="M14 32C10 36 8 42 12 48" stroke="#6B7280" strokeWidth="4" strokeLinecap="round"/>
    <path d="M14 32C10 36 8 42 12 48" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Segments de la trompe */}
    <path d="M12 36M11 40M10 44" stroke="#4B5563" strokeWidth="0.75"/>
    {/* Oeil */}
    <circle cx="18" cy="26" r="2" fill="#1F2937"/>
    <circle cx="17.5" cy="25.5" r="0.75" fill="#F3F4F6"/>
    {/* Défense */}
    <path d="M16 32C14 34 14 36 16 38" stroke="#F5F5F4" strokeWidth="2" strokeLinecap="round"/>
    {/* Pattes mécaniques */}
    <rect x="22" y="44" width="5" height="8" rx="1" fill="#6B7280" stroke="#374151" strokeWidth="1"/>
    <rect x="37" y="44" width="5" height="8" rx="1" fill="#6B7280" stroke="#374151" strokeWidth="1"/>
    {/* Plateforme sur le dos */}
    <rect x="26" y="24" width="12" height="4" rx="1" fill="#854D0E" stroke="#713F12" strokeWidth="0.75"/>
  </svg>
);

// Strasbourg - Cathédrale Notre-Dame (flèche gothique unique)
export const StrasbourgIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FEF9C3"/>
    {/* Corps de la cathédrale - grès rose */}
    <rect x="18" y="30" width="28" height="22" fill="#FCA5A5" stroke="#B91C1C" strokeWidth="1.5"/>
    {/* Façade avec détails gothiques */}
    <path d="M18 30L32 18L46 30" fill="#FECACA" stroke="#B91C1C" strokeWidth="1"/>
    {/* Unique flèche (caractéristique de Strasbourg) */}
    <path d="M32 18L28 30H36L32 18Z" fill="#FCA5A5" stroke="#B91C1C" strokeWidth="1"/>
    <path d="M32 6L29 18H35L32 6Z" fill="#FECACA" stroke="#B91C1C" strokeWidth="1"/>
    {/* Croix au sommet */}
    <path d="M32 4V6M31 5H33" stroke="#B91C1C" strokeWidth="1"/>
    {/* Rosace centrale */}
    <circle cx="32" cy="36" r="5" fill="#FEF9C3" stroke="#B91C1C" strokeWidth="1"/>
    <circle cx="32" cy="36" r="3" fill="#FDE047" stroke="#B91C1C" strokeWidth="0.5"/>
    <path d="M32 32V40M28 36H36" stroke="#B91C1C" strokeWidth="0.5"/>
    {/* Portails gothiques */}
    <path d="M22 52V44C22 42 24 40 26 40C28 40 30 42 30 44V52" fill="#7F1D1D"/>
    <path d="M34 52V44C34 42 36 40 38 40C40 40 42 42 42 44V52" fill="#7F1D1D"/>
    {/* Fenêtres gothiques */}
    <path d="M20 34C20 33 21 32 22 32C23 32 24 33 24 34V38H20V34Z" fill="#FEF9C3" stroke="#B91C1C" strokeWidth="0.5"/>
    <path d="M40 34C40 33 41 32 42 32C43 32 44 33 44 34V38H40V34Z" fill="#FEF9C3" stroke="#B91C1C" strokeWidth="0.5"/>
    {/* Détails de la flèche */}
    <path d="M30 12H34M29 15H35" stroke="#B91C1C" strokeWidth="0.5" opacity="0.6"/>
  </svg>
);

// Lille - Beffroi de l'Hôtel de ville (UNESCO)
export const LilleIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FDF4FF"/>
    {/* Base de l'hôtel de ville */}
    <rect x="14" y="42" width="36" height="12" fill="#F5F3FF" stroke="#7E22CE" strokeWidth="1.5"/>
    {/* Corps du beffroi */}
    <rect x="24" y="22" width="16" height="20" fill="#F5F3FF" stroke="#7E22CE" strokeWidth="1.5"/>
    {/* Section supérieure du beffroi */}
    <rect x="26" y="14" width="12" height="8" fill="#F5F3FF" stroke="#7E22CE" strokeWidth="1"/>
    {/* Toit flamand caractéristique */}
    <path d="M26 14L32 6L38 14" fill="#A855F7" stroke="#7E22CE" strokeWidth="1"/>
    {/* Flèche */}
    <path d="M32 6V3" stroke="#7E22CE" strokeWidth="1.5"/>
    <circle cx="32" cy="2.5" r="1" fill="#FCD34D"/>
    {/* Horloge */}
    <circle cx="32" cy="28" r="4" fill="#FDF4FF" stroke="#7E22CE" strokeWidth="1"/>
    <path d="M32 26V28L34 29" stroke="#7E22CE" strokeWidth="0.75"/>
    {/* Fenêtres Art Déco */}
    <rect x="28" y="16" width="3" height="4" fill="#E9D5FF" stroke="#7E22CE" strokeWidth="0.5"/>
    <rect x="33" y="16" width="3" height="4" fill="#E9D5FF" stroke="#7E22CE" strokeWidth="0.5"/>
    <rect x="27" y="34" width="4" height="6" fill="#E9D5FF" stroke="#7E22CE" strokeWidth="0.5"/>
    <rect x="33" y="34" width="4" height="6" fill="#E9D5FF" stroke="#7E22CE" strokeWidth="0.5"/>
    {/* Entrée */}
    <rect x="28" y="46" width="8" height="8" fill="#7E22CE"/>
    {/* Détails géométriques Art Déco */}
    <path d="M24 42L24 22M40 42L40 22" stroke="#A855F7" strokeWidth="0.5"/>
  </svg>
);

// Montpellier - Place de la Comédie et les Trois Grâces
export const MontpellierIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FFF7ED"/>
    {/* Place ovale */}
    <ellipse cx="32" cy="50" rx="22" ry="8" fill="#FED7AA"/>
    {/* Fontaine des Trois Grâces */}
    <ellipse cx="32" cy="46" rx="8" ry="3" fill="#BFDBFE" stroke="#0369A1" strokeWidth="1"/>
    {/* Bassin */}
    <ellipse cx="32" cy="48" rx="10" ry="4" fill="#93C5FD" opacity="0.5"/>
    {/* Socle de la fontaine */}
    <rect x="28" y="36" width="8" height="10" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1"/>
    {/* Les Trois Grâces (silhouettes) */}
    <ellipse cx="29" cy="32" rx="2" ry="3" fill="#D1D5DB" stroke="#6B7280" strokeWidth="0.5"/>
    <ellipse cx="32" cy="30" rx="2" ry="4" fill="#D1D5DB" stroke="#6B7280" strokeWidth="0.5"/>
    <ellipse cx="35" cy="32" rx="2" ry="3" fill="#D1D5DB" stroke="#6B7280" strokeWidth="0.5"/>
    {/* Têtes */}
    <circle cx="29" cy="28" r="1.5" fill="#D1D5DB" stroke="#6B7280" strokeWidth="0.5"/>
    <circle cx="32" cy="26" r="1.5" fill="#D1D5DB" stroke="#6B7280" strokeWidth="0.5"/>
    <circle cx="35" cy="28" r="1.5" fill="#D1D5DB" stroke="#6B7280" strokeWidth="0.5"/>
    {/* Opéra Comédie en arrière-plan */}
    <rect x="10" y="24" width="16" height="18" fill="#FDBA74" stroke="#C2410C" strokeWidth="1"/>
    <rect x="38" y="24" width="16" height="18" fill="#FDBA74" stroke="#C2410C" strokeWidth="1"/>
    <path d="M10 24L18 18L26 24" fill="#FB923C" stroke="#C2410C" strokeWidth="0.75"/>
    <path d="M38 24L46 18L54 24" fill="#FB923C" stroke="#C2410C" strokeWidth="0.75"/>
    {/* Colonnes de l'Opéra */}
    <rect x="12" y="28" width="2" height="12" fill="#FFF7ED" stroke="#C2410C" strokeWidth="0.5"/>
    <rect x="22" y="28" width="2" height="12" fill="#FFF7ED" stroke="#C2410C" strokeWidth="0.5"/>
  </svg>
);

// Rennes - Parlement de Bretagne
export const RennesIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#F1F5F9"/>
    {/* Place pavée */}
    <rect x="6" y="48" width="52" height="8" fill="#CBD5E1"/>
    {/* Corps principal du Parlement */}
    <rect x="10" y="28" width="44" height="20" fill="#F8FAFC" stroke="#475569" strokeWidth="1.5"/>
    {/* Toit à la française */}
    <path d="M8 28L14 20H50L56 28" fill="#1E293B" stroke="#0F172A" strokeWidth="1"/>
    {/* Lucarnes */}
    <path d="M20 28L24 22L28 28" fill="#334155" stroke="#0F172A" strokeWidth="0.75"/>
    <path d="M36 28L40 22L44 28" fill="#334155" stroke="#0F172A" strokeWidth="0.75"/>
    {/* Fronton central avec armoiries */}
    <path d="M26 20L32 14L38 20" fill="#F8FAFC" stroke="#475569" strokeWidth="1"/>
    <circle cx="32" cy="17" r="2" fill="#FCD34D" stroke="#475569" strokeWidth="0.5"/>
    {/* Colonnes */}
    <rect x="14" y="32" width="2" height="14" fill="#E2E8F0" stroke="#475569" strokeWidth="0.5"/>
    <rect x="22" y="32" width="2" height="14" fill="#E2E8F0" stroke="#475569" strokeWidth="0.5"/>
    <rect x="40" y="32" width="2" height="14" fill="#E2E8F0" stroke="#475569" strokeWidth="0.5"/>
    <rect x="48" y="32" width="2" height="14" fill="#E2E8F0" stroke="#475569" strokeWidth="0.5"/>
    {/* Porte centrale */}
    <rect x="28" y="38" width="8" height="10" fill="#1E293B"/>
    <path d="M28 38C28 35 30 33 32 33C34 33 36 35 36 38" fill="#1E293B" stroke="#475569" strokeWidth="0.75"/>
    {/* Fenêtres */}
    <rect x="16" y="34" width="4" height="6" fill="#E2E8F0" stroke="#475569" strokeWidth="0.5"/>
    <rect x="44" y="34" width="4" height="6" fill="#E2E8F0" stroke="#475569" strokeWidth="0.5"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// CANADA
// ═══════════════════════════════════════════════════════════════════════════════

// Montréal - Mont Royal avec la Croix illuminée
export const MontrealIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#ECFDF5"/>
    {/* Ciel étoilé */}
    <circle cx="12" cy="12" r="1" fill="#FCD34D"/>
    <circle cx="52" cy="16" r="1" fill="#FCD34D"/>
    <circle cx="44" cy="10" r="0.75" fill="#FCD34D"/>
    {/* Mont Royal */}
    <path d="M0 56C0 56 16 32 32 28C48 32 64 56 64 56H0Z" fill="#22C55E"/>
    <path d="M8 56C8 56 20 38 32 34C44 38 56 56 56 56" fill="#16A34A"/>
    {/* Arbres sur la montagne */}
    <ellipse cx="18" cy="46" rx="4" ry="6" fill="#15803D"/>
    <ellipse cx="46" cy="46" rx="4" ry="6" fill="#15803D"/>
    <ellipse cx="26" cy="42" rx="3" ry="5" fill="#166534"/>
    <ellipse cx="38" cy="42" rx="3" ry="5" fill="#166534"/>
    {/* La Croix du Mont-Royal illuminée */}
    <rect x="30" y="14" width="4" height="24" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1"/>
    <rect x="24" y="20" width="16" height="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1"/>
    {/* Lumière de la croix */}
    <rect x="31" y="15" width="2" height="22" fill="#FEF08A"/>
    <rect x="25" y="21" width="14" height="2" fill="#FEF08A"/>
    {/* Halo lumineux */}
    <circle cx="32" cy="26" r="12" fill="#FEF08A" opacity="0.2"/>
    {/* Skyline en bas */}
    <rect x="10" y="52" width="6" height="8" fill="#1F2937"/>
    <rect x="18" y="50" width="4" height="10" fill="#374151"/>
    <rect x="42" y="50" width="4" height="10" fill="#374151"/>
    <rect x="48" y="52" width="6" height="8" fill="#1F2937"/>
  </svg>
);

// Toronto - CN Tower
export const TorontoIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#EFF6FF"/>
    {/* Skyline de Toronto */}
    <rect x="8" y="44" width="8" height="12" fill="#1E3A5F"/>
    <rect x="18" y="40" width="6" height="16" fill="#1E3A5F"/>
    <rect x="40" y="42" width="6" height="14" fill="#1E3A5F"/>
    <rect x="48" y="38" width="8" height="18" fill="#1E3A5F"/>
    {/* CN Tower - antenne */}
    <path d="M32 6V18" stroke="#6B7280" strokeWidth="2"/>
    <path d="M32 6L31 10H33L32 6Z" fill="#9CA3AF"/>
    {/* CN Tower - pod principal */}
    <ellipse cx="32" cy="22" rx="6" ry="3" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1"/>
    <rect x="27" y="19" width="10" height="6" fill="#F3F4F6" stroke="#6B7280" strokeWidth="1"/>
    <ellipse cx="32" cy="25" rx="6" ry="3" fill="#D1D5DB" stroke="#6B7280" strokeWidth="1"/>
    {/* Fenêtres du pod - SkyPod */}
    <rect x="28" y="20" width="8" height="3" fill="#3B82F6" rx="1"/>
    {/* Pod inférieur */}
    <ellipse cx="32" cy="30" rx="4" ry="2" fill="#E5E7EB" stroke="#6B7280" strokeWidth="0.75"/>
    {/* Tour principale */}
    <path d="M30 30V54H34V30" fill="#D1D5DB" stroke="#6B7280" strokeWidth="1"/>
    {/* Base évasée */}
    <path d="M30 54L26 56H38L34 54" fill="#9CA3AF" stroke="#6B7280" strokeWidth="0.75"/>
    {/* Lumière rouge au sommet */}
    <circle cx="32" cy="7" r="1.5" fill="#EF4444"/>
    {/* Lac Ontario */}
    <ellipse cx="32" cy="58" rx="28" ry="4" fill="#3B82F6" opacity="0.3"/>
  </svg>
);

// Québec - Château Frontenac
export const QuebecIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#ECFDF5"/>
    {/* Fleuve Saint-Laurent */}
    <ellipse cx="32" cy="56" rx="28" ry="6" fill="#0EA5E9"/>
    {/* Falaise / Terrasse Dufferin */}
    <path d="M8 52H56V48L52 46H12L8 48V52Z" fill="#A3A3A3"/>
    {/* Corps principal du château - briques */}
    <rect x="16" y="26" width="32" height="22" fill="#047857" stroke="#065F46" strokeWidth="1.5"/>
    {/* Toits en cuivre vert caractéristiques */}
    <path d="M16 26L24 18L32 26" fill="#10B981" stroke="#065F46" strokeWidth="1"/>
    <path d="M32 26L40 18L48 26" fill="#10B981" stroke="#065F46" strokeWidth="1"/>
    {/* Tour centrale (la plus haute) */}
    <rect x="28" y="10" width="8" height="16" fill="#047857" stroke="#065F46" strokeWidth="1"/>
    <path d="M28 10L32 4L36 10" fill="#10B981" stroke="#065F46" strokeWidth="1"/>
    {/* Tours latérales */}
    <rect x="14" y="18" width="6" height="8" fill="#047857" stroke="#065F46" strokeWidth="1"/>
    <path d="M14 18L17 12L20 18" fill="#10B981" stroke="#065F46" strokeWidth="0.75"/>
    <rect x="44" y="18" width="6" height="8" fill="#047857" stroke="#065F46" strokeWidth="1"/>
    <path d="M44 18L47 12L50 18" fill="#10B981" stroke="#065F46" strokeWidth="0.75"/>
    {/* Fenêtres */}
    <rect x="20" y="32" width="4" height="6" fill="#D1FAE5" stroke="#065F46" strokeWidth="0.5"/>
    <rect x="30" y="32" width="4" height="6" fill="#D1FAE5" stroke="#065F46" strokeWidth="0.5"/>
    <rect x="40" y="32" width="4" height="6" fill="#D1FAE5" stroke="#065F46" strokeWidth="0.5"/>
    {/* Fenêtres de la tour centrale */}
    <rect x="30" y="14" width="4" height="4" fill="#D1FAE5" stroke="#065F46" strokeWidth="0.5"/>
    {/* Drapeau */}
    <path d="M32 4V2" stroke="#065F46" strokeWidth="0.75"/>
    <rect x="32" y="1" width="4" height="2" fill="#3B82F6"/>
  </svg>
);

// Vancouver - Montagnes, eau et skyline
export const VancouverIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#F0FDFA"/>
    {/* Ciel */}
    <circle cx="52" cy="12" r="5" fill="#FBBF24"/>
    {/* Montagnes enneigées en arrière-plan */}
    <path d="M0 36L12 18L24 32L36 14L48 28L64 20V36H0Z" fill="#14B8A6"/>
    <path d="M12 18L8 24L16 24L12 18Z" fill="#F8FAFC"/>
    <path d="M36 14L30 24L42 24L36 14Z" fill="#F8FAFC"/>
    <path d="M48 28L44 32L52 32L48 28Z" fill="#F8FAFC"/>
    {/* Forêt */}
    <path d="M0 40C8 36 16 42 24 38C32 42 40 36 48 40C56 36 60 42 64 40V48H0V40Z" fill="#059669"/>
    {/* Océan Pacifique */}
    <rect x="0" y="44" width="64" height="12" fill="#0891B2"/>
    <path d="M0 48C8 46 16 50 24 48C32 50 40 46 48 48C56 50 60 46 64 48V52H0V48Z" fill="#0E7490"/>
    {/* Skyline de Vancouver */}
    <rect x="20" y="36" width="4" height="8" fill="#1F2937"/>
    <rect x="26" y="32" width="6" height="12" fill="#374151"/>
    <rect x="34" y="34" width="4" height="10" fill="#1F2937"/>
    <rect x="40" y="38" width="4" height="6" fill="#374151"/>
    {/* Canada Place (voiles blanches) */}
    <path d="M14 44L18 36L22 44" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.75"/>
    <path d="M10 44L14 38L18 44" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="0.75"/>
    {/* Reflets dans l'eau */}
    <rect x="20" y="48" width="24" height="4" fill="#1F2937" opacity="0.2"/>
  </svg>
);

// Ottawa - Colline du Parlement avec Tour de la Paix
export const OttawaIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FEF3C7"/>
    {/* Pelouse devant le Parlement */}
    <ellipse cx="32" cy="54" rx="26" ry="6" fill="#86EFAC"/>
    {/* Bâtiment principal - pierre */}
    <rect x="10" y="30" width="44" height="20" fill="#D6D3D1" stroke="#78716C" strokeWidth="1.5"/>
    {/* Ailes du bâtiment */}
    <rect x="6" y="34" width="8" height="16" fill="#D6D3D1" stroke="#78716C" strokeWidth="1"/>
    <rect x="50" y="34" width="8" height="16" fill="#D6D3D1" stroke="#78716C" strokeWidth="1"/>
    {/* Tour de la Paix (Peace Tower) - centre */}
    <rect x="28" y="12" width="8" height="18" fill="#D6D3D1" stroke="#78716C" strokeWidth="1"/>
    {/* Toit gothique de la tour */}
    <path d="M28 12L32 4L36 12" fill="#166534" stroke="#14532D" strokeWidth="1"/>
    {/* Horloge de la Tour de la Paix */}
    <circle cx="32" cy="18" r="3" fill="#FEF9C3" stroke="#78716C" strokeWidth="0.75"/>
    <path d="M32 16V18L34 19" stroke="#78716C" strokeWidth="0.75"/>
    {/* Drapeau canadien */}
    <path d="M32 4V2" stroke="#78716C" strokeWidth="0.75"/>
    <rect x="32" y="1" width="4" height="2.5" fill="#DC2626"/>
    {/* Fenêtres gothiques */}
    <path d="M14 36C14 34 16 33 18 33C20 33 22 34 22 36V44H14V36Z" fill="#451A03" stroke="#78716C" strokeWidth="0.5"/>
    <path d="M42 36C42 34 44 33 46 33C48 33 50 34 50 36V44H42V36Z" fill="#451A03" stroke="#78716C" strokeWidth="0.5"/>
    {/* Porte centrale */}
    <path d="M28 50V42C28 40 30 38 32 38C34 38 36 40 36 42V50" fill="#451A03"/>
    {/* Tours secondaires */}
    <path d="M10 34L14 28L18 34" fill="#166534" stroke="#14532D" strokeWidth="0.75"/>
    <path d="M46 34L50 28L54 34" fill="#166534" stroke="#14532D" strokeWidth="0.75"/>
  </svg>
);

// Calgary - Calgary Tower avec les Rocheuses
export const CalgaryIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FDF2F8"/>
    {/* Rocheuses en arrière-plan */}
    <path d="M0 40L10 24L20 36L30 20L40 32L50 18L64 34V40H0Z" fill="#6366F1"/>
    <path d="M10 24L6 30L14 30L10 24Z" fill="#F8FAFC"/>
    <path d="M30 20L24 30L36 30L30 20Z" fill="#F8FAFC"/>
    <path d="M50 18L44 28L56 28L50 18Z" fill="#F8FAFC"/>
    {/* Prairie */}
    <rect x="0" y="38" width="64" height="18" fill="#86EFAC"/>
    {/* Skyline */}
    <rect x="8" y="44" width="6" height="12" fill="#1F2937"/>
    <rect x="16" y="42" width="4" height="14" fill="#374151"/>
    <rect x="44" y="44" width="6" height="12" fill="#1F2937"/>
    <rect x="52" y="40" width="6" height="16" fill="#374151"/>
    {/* Calgary Tower */}
    <path d="M32 12V48" stroke="#78716C" strokeWidth="3"/>
    <path d="M32 12V48" stroke="#A8A29E" strokeWidth="2"/>
    {/* Observation deck */}
    <ellipse cx="32" cy="20" rx="6" ry="3" fill="#F5F5F4" stroke="#78716C" strokeWidth="1"/>
    <rect x="27" y="17" width="10" height="6" fill="#E7E5E4" stroke="#78716C" strokeWidth="1"/>
    {/* Restaurant tournant */}
    <ellipse cx="32" cy="23" rx="5" ry="2.5" fill="#DC2626" stroke="#78716C" strokeWidth="0.75"/>
    {/* Fenêtres */}
    <rect x="28" y="18" width="8" height="3" fill="#7DD3FC" rx="1"/>
    {/* Flamme olympique au sommet */}
    <circle cx="32" cy="11" r="2" fill="#F97316"/>
    <path d="M32 9C32 7 31 6 32 5C33 6 32 7 32 9Z" fill="#FBBF24"/>
    {/* Base */}
    <ellipse cx="32" cy="50" rx="8" ry="3" fill="#78716C"/>
  </svg>
);

// Edmonton - Alberta Legislature Building avec le dôme
export const EdmontonIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#F5F3FF"/>
    {/* Jardins et pelouse */}
    <ellipse cx="32" cy="54" rx="26" ry="6" fill="#86EFAC"/>
    {/* Fontaine */}
    <ellipse cx="32" cy="52" rx="6" ry="2" fill="#7DD3FC"/>
    {/* Corps principal du bâtiment */}
    <rect x="12" y="32" width="40" height="18" fill="#F5F5F4" stroke="#78716C" strokeWidth="1.5"/>
    {/* Ailes */}
    <rect x="8" y="36" width="8" height="14" fill="#F5F5F4" stroke="#78716C" strokeWidth="1"/>
    <rect x="48" y="36" width="8" height="14" fill="#F5F5F4" stroke="#78716C" strokeWidth="1"/>
    {/* Dôme central */}
    <ellipse cx="32" cy="28" rx="10" ry="6" fill="#E5E7EB" stroke="#78716C" strokeWidth="1"/>
    <path d="M26 28C26 22 28 18 32 16C36 18 38 22 38 28" fill="#D1D5DB" stroke="#78716C" strokeWidth="1"/>
    {/* Lanterne du dôme */}
    <rect x="30" y="12" width="4" height="4" fill="#F5F5F4" stroke="#78716C" strokeWidth="0.75"/>
    <ellipse cx="32" cy="12" rx="3" ry="1.5" fill="#E5E7EB" stroke="#78716C" strokeWidth="0.5"/>
    {/* Statue au sommet */}
    <path d="M32 10V8" stroke="#78716C" strokeWidth="1"/>
    <circle cx="32" cy="7" r="1.5" fill="#FCD34D"/>
    {/* Colonnade */}
    <rect x="16" y="36" width="2" height="12" fill="#E7E5E4" stroke="#78716C" strokeWidth="0.5"/>
    <rect x="22" y="36" width="2" height="12" fill="#E7E5E4" stroke="#78716C" strokeWidth="0.5"/>
    <rect x="28" y="36" width="2" height="12" fill="#E7E5E4" stroke="#78716C" strokeWidth="0.5"/>
    <rect x="34" y="36" width="2" height="12" fill="#E7E5E4" stroke="#78716C" strokeWidth="0.5"/>
    <rect x="40" y="36" width="2" height="12" fill="#E7E5E4" stroke="#78716C" strokeWidth="0.5"/>
    <rect x="46" y="36" width="2" height="12" fill="#E7E5E4" stroke="#78716C" strokeWidth="0.5"/>
    {/* Entrée */}
    <rect x="28" y="42" width="8" height="8" fill="#78716C"/>
  </svg>
);

// Winnipeg - Manitoba Legislative Building avec le Golden Boy
export const WinnipegIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FFFBEB"/>
    {/* Jardins */}
    <ellipse cx="32" cy="54" rx="26" ry="6" fill="#86EFAC"/>
    {/* Corps principal - Beaux-Arts */}
    <rect x="10" y="32" width="44" height="18" fill="#F5F5F4" stroke="#78716C" strokeWidth="1.5"/>
    {/* Portique avec colonnes */}
    <rect x="22" y="32" width="20" height="18" fill="#E7E5E4" stroke="#78716C" strokeWidth="1"/>
    <rect x="24" y="34" width="2" height="14" fill="#D6D3D1" stroke="#78716C" strokeWidth="0.5"/>
    <rect x="29" y="34" width="2" height="14" fill="#D6D3D1" stroke="#78716C" strokeWidth="0.5"/>
    <rect x="33" y="34" width="2" height="14" fill="#D6D3D1" stroke="#78716C" strokeWidth="0.5"/>
    <rect x="38" y="34" width="2" height="14" fill="#D6D3D1" stroke="#78716C" strokeWidth="0.5"/>
    {/* Dôme */}
    <path d="M24 32C24 24 28 20 32 18C36 20 40 24 40 32" fill="#D6D3D1" stroke="#78716C" strokeWidth="1"/>
    <ellipse cx="32" cy="32" rx="8" ry="3" fill="#E7E5E4" stroke="#78716C" strokeWidth="0.75"/>
    {/* Tambour du dôme */}
    <rect x="28" y="14" width="8" height="4" fill="#E7E5E4" stroke="#78716C" strokeWidth="0.75"/>
    {/* Golden Boy - statue dorée emblématique */}
    <ellipse cx="32" cy="10" rx="2" ry="3" fill="#FCD34D" stroke="#F59E0B" strokeWidth="0.75"/>
    <circle cx="32" cy="7" r="1.5" fill="#FCD34D" stroke="#F59E0B" strokeWidth="0.5"/>
    {/* Torche du Golden Boy */}
    <path d="M34 6L36 4" stroke="#FCD34D" strokeWidth="1"/>
    <circle cx="36.5" cy="3.5" r="1" fill="#F97316"/>
    {/* Rayons autour du Golden Boy */}
    <path d="M32 4V2M29 5L27 3M35 5L37 3" stroke="#FCD34D" strokeWidth="0.5" opacity="0.6"/>
    {/* Ailes du bâtiment */}
    <path d="M10 32L16 28L22 32" fill="#D6D3D1" stroke="#78716C" strokeWidth="0.75"/>
    <path d="M42 32L48 28L54 32" fill="#D6D3D1" stroke="#78716C" strokeWidth="0.75"/>
  </svg>
);

// Halifax - Horloge de la vieille ville (Old Town Clock)
export const HalifaxIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#F0F9FF"/>
    {/* Citadel Hill */}
    <path d="M0 48C10 40 22 44 32 38C42 44 54 40 64 48V56H0V48Z" fill="#86EFAC"/>
    {/* Port / Océan Atlantique */}
    <rect x="0" y="52" width="64" height="8" fill="#0EA5E9"/>
    <path d="M0 54C12 52 24 56 36 54C48 52 56 56 64 54V56H0V54Z" fill="#0284C7"/>
    {/* Base de la tour horloge - style palladien */}
    <rect x="22" y="36" width="20" height="16" fill="#F5F5F4" stroke="#78716C" strokeWidth="1.5"/>
    {/* Porte */}
    <path d="M28 52V46C28 44 30 42 32 42C34 42 36 44 36 46V52" fill="#78716C"/>
    {/* Section de l'horloge */}
    <rect x="24" y="24" width="16" height="12" fill="#F5F5F4" stroke="#78716C" strokeWidth="1"/>
    {/* Horloge (Old Town Clock) */}
    <circle cx="32" cy="30" r="6" fill="#FFFBEB" stroke="#78716C" strokeWidth="1.5"/>
    <circle cx="32" cy="30" r="4.5" fill="#FEF9C3" stroke="#78716C" strokeWidth="0.75"/>
    {/* Aiguilles de l'horloge */}
    <path d="M32 27V30L35 32" stroke="#1F2937" strokeWidth="1" strokeLinecap="round"/>
    {/* Chiffres romains simplifiés */}
    <text x="32" y="26" textAnchor="middle" fontSize="2" fill="#78716C">XII</text>
    <text x="36" y="31" textAnchor="middle" fontSize="2" fill="#78716C">III</text>
    {/* Toit */}
    <path d="M24 24L32 16L40 24" fill="#1E3A5F" stroke="#0F172A" strokeWidth="1"/>
    {/* Coupole */}
    <ellipse cx="32" cy="16" rx="4" ry="2" fill="#1E3A5F" stroke="#0F172A" strokeWidth="0.75"/>
    <path d="M30 16C30 14 31 12 32 11C33 12 34 14 34 16" fill="#1E3A5F" stroke="#0F172A" strokeWidth="0.75"/>
    {/* Flèche */}
    <path d="M32 11V8" stroke="#78716C" strokeWidth="1"/>
    <circle cx="32" cy="7" r="1" fill="#FCD34D"/>
    {/* Bateau dans le port */}
    <path d="M50 54L52 50L54 54" fill="#F5F5F4" stroke="#78716C" strokeWidth="0.5"/>
    <rect x="51" y="54" width="2" height="2" fill="#78716C"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ILLUSTRATIONS GÉNÉRIQUES PAR TYPE DE VILLE
// ═══════════════════════════════════════════════════════════════════════════════

// Ville côtière - Plage et mer
export const CoastalCityIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#ECFEFF"/>
    {/* Soleil */}
    <circle cx="50" cy="14" r="6" fill="#FBBF24"/>
    <circle cx="50" cy="14" r="4" fill="#FCD34D"/>
    {/* Mer */}
    <path d="M0 40C10 38 20 42 32 40C44 38 54 42 64 40V56H0V40Z" fill="#0EA5E9"/>
    <path d="M0 44C10 42 20 46 32 44C44 42 54 46 64 44V56H0V44Z" fill="#0284C7"/>
    {/* Plage */}
    <rect x="0" y="48" width="64" height="8" fill="#FDE68A"/>
    {/* Mouette */}
    <path d="M18 22C16 24 20 24 22 22" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M38 18C36 20 40 20 42 18" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Vagues */}
    <path d="M0 50C8 48 16 52 24 50C32 48 40 52 48 50C56 48 60 52 64 50" stroke="#FFFFFF" strokeWidth="1" opacity="0.5"/>
  </svg>
);

// Ville de montagne
export const MountainCityIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#F0F9FF"/>
    {/* Ciel */}
    <circle cx="52" cy="12" r="5" fill="#FBBF24"/>
    {/* Montagnes enneigées */}
    <path d="M0 36L12 18L24 32L36 14L48 28L64 20V56H0V36Z" fill="#6366F1"/>
    <path d="M12 18L8 24L16 24L12 18Z" fill="#F8FAFC"/>
    <path d="M36 14L30 24L42 24L36 14Z" fill="#F8FAFC"/>
    <path d="M48 28L44 32L52 32L48 28Z" fill="#F8FAFC"/>
    {/* Forêt */}
    <path d="M0 40C8 36 16 42 24 38C32 42 40 36 48 40C56 36 60 42 64 40V56H0V40Z" fill="#059669"/>
    {/* Vallée */}
    <rect x="0" y="48" width="64" height="8" fill="#86EFAC"/>
  </svg>
);

// Ville de campagne / collines
export const CountrysideCityIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#FEF9C3"/>
    {/* Soleil */}
    <circle cx="50" cy="14" r="6" fill="#FBBF24"/>
    {/* Collines */}
    <ellipse cx="16" cy="48" rx="20" ry="12" fill="#86EFAC"/>
    <ellipse cx="48" cy="50" rx="22" ry="14" fill="#22C55E"/>
    <ellipse cx="32" cy="52" rx="24" ry="10" fill="#16A34A"/>
    {/* Arbres */}
    <ellipse cx="20" cy="42" rx="4" ry="6" fill="#15803D"/>
    <ellipse cx="44" cy="44" rx="4" ry="6" fill="#15803D"/>
    <ellipse cx="32" cy="40" rx="3" ry="5" fill="#166534"/>
    {/* Champs */}
    <path d="M0 52H64V56H0V52Z" fill="#FDE047"/>
    <path d="M0 54H64" stroke="#FCD34D" strokeWidth="0.5" opacity="0.5"/>
  </svg>
);

// Ville standard / urbaine
export const StandardCityIllustration: React.FC<CityIllustrationProps> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect width="64" height="64" rx="12" fill="#F3F4F6"/>
    {/* Skyline */}
    <rect x="8" y="38" width="8" height="18" fill="#1F2937"/>
    <rect x="18" y="32" width="10" height="24" fill="#374151"/>
    <rect x="30" y="28" width="8" height="28" fill="#1F2937"/>
    <rect x="40" y="34" width="10" height="22" fill="#374151"/>
    <rect x="52" y="40" width="8" height="16" fill="#1F2937"/>
    {/* Fenêtres */}
    <rect x="10" y="42" width="2" height="2" fill="#FCD34D"/>
    <rect x="13" y="42" width="2" height="2" fill="#FCD34D"/>
    <rect x="10" y="46" width="2" height="2" fill="#FCD34D"/>
    <rect x="20" y="36" width="2" height="2" fill="#FCD34D"/>
    <rect x="24" y="36" width="2" height="2" fill="#FCD34D"/>
    <rect x="20" y="40" width="2" height="2" fill="#FCD34D"/>
    <rect x="32" y="32" width="2" height="2" fill="#FCD34D"/>
    <rect x="32" y="36" width="2" height="2" fill="#FCD34D"/>
    <rect x="42" y="38" width="2" height="2" fill="#FCD34D"/>
    <rect x="46" y="38" width="2" height="2" fill="#FCD34D"/>
    <rect x="54" y="44" width="2" height="2" fill="#FCD34D"/>
    {/* Sol */}
    <rect x="0" y="56" width="64" height="8" fill="#D1D5DB"/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Base de données des types de villes
// ═══════════════════════════════════════════════════════════════════════════════

type CityType = "coastal" | "mountain" | "countryside" | "standard";

const cityTypes: Record<string, CityType> = {
  // FRANCE - Villes côtières
  "Biarritz": "coastal", "Cannes": "coastal", "Antibes": "coastal", "Saint-Tropez": "coastal",
  "La Rochelle": "coastal", "Brest": "coastal", "Toulon": "coastal", "Calais": "coastal",
  "Dunkerque": "coastal", "Cherbourg": "coastal", "Saint-Malo": "coastal", "Lorient": "coastal",
  "Boulogne-sur-Mer": "coastal", "Arcachon": "coastal", "Sète": "coastal", "Perpignan": "coastal",
  "Bayonne": "coastal", "Ajaccio": "coastal", "Bastia": "coastal", "Hyères": "coastal",
  "Fréjus": "coastal", "Menton": "coastal", "Royan": "coastal", "Quimper": "coastal",

  // FRANCE - Villes de montagne
  "Grenoble": "mountain", "Annecy": "mountain", "Chambéry": "mountain", "Chamonix": "mountain",
  "Briançon": "mountain", "Gap": "mountain", "Albertville": "mountain", "Thonon-les-Bains": "mountain",
  "Annemasse": "mountain", "Tarbes": "mountain", "Pau": "mountain", "Lourdes": "mountain",
  "Foix": "mountain", "Aurillac": "mountain", "Mende": "mountain",

  // FRANCE - Villes de campagne/collines
  "Reims": "countryside", "Dijon": "countryside", "Tours": "countryside", "Orléans": "countryside",
  "Angers": "countryside", "Le Mans": "countryside", "Clermont-Ferrand": "countryside",
  "Limoges": "countryside", "Poitiers": "countryside", "Bourges": "countryside",
  "Troyes": "countryside", "Chartres": "countryside", "Blois": "countryside",
  "Châteauroux": "countryside", "Nevers": "countryside", "Moulins": "countryside",
  "Auxerre": "countryside", "Beauvais": "countryside", "Compiègne": "countryside",
  "Laon": "countryside", "Soissons": "countryside", "Épinal": "countryside",
  "Colmar": "countryside", "Mulhouse": "countryside", "Belfort": "countryside",
  "Besançon": "countryside", "Mâcon": "countryside", "Bourg-en-Bresse": "countryside",
  "Valence": "countryside", "Avignon": "countryside", "Nîmes": "countryside",
  "Arles": "countryside", "Aix-en-Provence": "countryside", "Albi": "countryside",
  "Montauban": "countryside", "Agen": "countryside", "Périgueux": "countryside",
  "Angoulême": "countryside", "Niort": "countryside", "Châtellerault": "countryside",
  "Rodez": "countryside", "Cahors": "countryside", "Auch": "countryside",
  "Alençon": "countryside", "Évreux": "countryside", "Rouen": "countryside",
  "Amiens": "countryside", "Arras": "countryside", "Douai": "countryside",
  "Valenciennes": "countryside", "Lens": "countryside", "Béthune": "countryside",
  "Saint-Quentin": "countryside", "Charleville-Mézières": "countryside",
  "Metz": "countryside", "Nancy": "countryside", "Verdun": "countryside",
  "Bar-le-Duc": "countryside", "Chaumont": "countryside", "Saint-Dizier": "countryside",
  "Vesoul": "countryside", "Lons-le-Saunier": "countryside", "Dole": "countryside",
  "Chalon-sur-Saône": "countryside", "Le Creusot": "countryside",
  "Montceau-les-Mines": "countryside", "Vichy": "countryside", "Montluçon": "countryside",
  "Le Puy-en-Velay": "countryside", "Privas": "countryside", "Romans-sur-Isère": "countryside",
  "Vienne": "countryside", "Annonay": "countryside", "Orange": "countryside",
  "Carpentras": "countryside", "Cavaillon": "countryside", "Salon-de-Provence": "countryside",
  "Martigues": "countryside", "Aubagne": "countryside", "Istres": "countryside",
  "Draguignan": "countryside", "Grasse": "countryside", "Cagnes-sur-Mer": "countryside",
  "Saint-Raphaël": "countryside", "Digne-les-Bains": "countryside", "Manosque": "countryside",
  "Apt": "countryside", "Sisteron": "countryside", "Embrun": "countryside",
  "Carcassonne": "countryside", "Narbonne": "countryside", "Béziers": "countryside",
  "Castres": "countryside", "Mazamet": "countryside", "Pamiers": "countryside",
  "Saint-Girons": "countryside", "Millau": "countryside", "Villefranche-de-Rouergue": "countryside",
  "Figeac": "countryside", "Gourdon": "countryside", "Sarlat-la-Canéda": "countryside",
  "Bergerac": "countryside", "Villeneuve-sur-Lot": "countryside", "Marmande": "countryside",
  "Dax": "countryside", "Mont-de-Marsan": "countryside", "Orthez": "countryside",
  "Oloron-Sainte-Marie": "countryside", "Bagnères-de-Bigorre": "countryside",
  "Saint-Gaudens": "countryside", "Muret": "countryside", "Castelsarrasin": "countryside",
  "Moissac": "countryside", "Condom": "countryside", "Lectoure": "countryside",
  "Mirande": "countryside", "Lannemezan": "countryside",

  // CANADA - Villes côtières
  "Victoria": "coastal", "Nanaimo": "coastal", "Kelowna": "coastal", "Kamloops": "coastal",
  "Prince Rupert": "coastal", "Prince George": "coastal", "Charlottetown": "coastal",
  "Summerside": "coastal", "Moncton": "coastal", "Saint John": "coastal",
  "Fredericton": "coastal", "Bathurst": "coastal", "Miramichi": "coastal",
  "St. John's": "coastal", "Corner Brook": "coastal", "Gander": "coastal",
  "Whitehorse": "mountain", "Yellowknife": "countryside", "Iqaluit": "coastal",

  // CANADA - Villes de montagne
  "Banff": "mountain", "Jasper": "mountain", "Whistler": "mountain", "Revelstoke": "mountain",
  "Nelson": "mountain", "Cranbrook": "mountain", "Fernie": "mountain",

  // CANADA - Villes de campagne/standard
  "Hamilton": "standard", "London": "countryside", "Windsor": "countryside",
  "Kitchener": "countryside", "Waterloo": "countryside", "Guelph": "countryside",
  "Barrie": "countryside", "Kingston": "countryside", "Peterborough": "countryside",
  "Oshawa": "countryside", "Thunder Bay": "countryside", "Sudbury": "countryside",
  "Sault Ste. Marie": "countryside", "North Bay": "countryside", "Timmins": "countryside",
  "Laval": "standard", "Gatineau": "countryside", "Longueuil": "standard",
  "Sherbrooke": "countryside", "Trois-Rivières": "countryside", "Saguenay": "countryside",
  "Lévis": "countryside", "Terrebonne": "countryside", "Saint-Jean-sur-Richelieu": "countryside",
  "Repentigny": "countryside", "Boucherville": "countryside", "Drummondville": "countryside",
  "Saint-Jérôme": "countryside", "Granby": "countryside", "Blainville": "countryside",
  "Shawinigan": "countryside", "Rimouski": "coastal", "Chicoutimi": "countryside",
  "Jonquière": "countryside", "Saint-Hyacinthe": "countryside", "Victoriaville": "countryside",
  "Sorel-Tracy": "countryside", "Joliette": "countryside", "Val-d'Or": "countryside",
  "Rouyn-Noranda": "countryside", "Thetford Mines": "countryside", "Sept-Îles": "coastal",
  "Regina": "countryside", "Saskatoon": "countryside", "Prince Albert": "countryside",
  "Moose Jaw": "countryside", "Swift Current": "countryside", "Yorkton": "countryside",
  "North Battleford": "countryside", "Estevan": "countryside", "Weyburn": "countryside",
  "Lethbridge": "countryside", "Red Deer": "countryside", "Medicine Hat": "countryside",
  "Grande Prairie": "countryside", "Airdrie": "countryside", "Spruce Grove": "countryside",
  "Leduc": "countryside", "Fort McMurray": "countryside", "Lloydminster": "countryside",
  "Brandon": "countryside", "Steinbach": "countryside", "Thompson": "countryside",
  "Portage la Prairie": "countryside", "Winkler": "countryside", "Selkirk": "countryside",
};

// ═══════════════════════════════════════════════════════════════════════════════
// Mapping des villes vers leurs illustrations
// ═══════════════════════════════════════════════════════════════════════════════

export const cityIllustrations: Record<string, React.FC<CityIllustrationProps>> = {
  // France - Villes avec illustrations personnalisées
  "Paris": ParisIllustration,
  "Lyon": LyonIllustration,
  "Bordeaux": BordeauxIllustration,
  "Nice": NiceIllustration,
  "Marseille": MarseilleIllustration,
  "Toulouse": ToulouseIllustration,
  "Nantes": NantesIllustration,
  "Strasbourg": StrasbourgIllustration,
  "Lille": LilleIllustration,
  "Montpellier": MontpellierIllustration,
  "Rennes": RennesIllustration,
  // Canada - Villes avec illustrations personnalisées
  "Montréal": MontrealIllustration,
  "Montreal": MontrealIllustration,
  "Toronto": TorontoIllustration,
  "Québec": QuebecIllustration,
  "Quebec": QuebecIllustration,
  "Vancouver": VancouverIllustration,
  "Ottawa": OttawaIllustration,
  "Calgary": CalgaryIllustration,
  "Edmonton": EdmontonIllustration,
  "Winnipeg": WinnipegIllustration,
  "Halifax": HalifaxIllustration,
};

// Composant générique qui affiche l'illustration de la ville
export const CityIllustration: React.FC<{ city: string; className?: string }> = ({ city, className }) => {
  // 1. Vérifier si la ville a une illustration personnalisée
  const CustomIllustration = cityIllustrations[city];
  if (CustomIllustration) {
    return <CustomIllustration className={className} />;
  }

  // 2. Sinon, utiliser l'illustration générique basée sur le type de ville
  const cityType = cityTypes[city];

  if (cityType === "coastal") {
    return <CoastalCityIllustration className={className} />;
  }

  if (cityType === "mountain") {
    return <MountainCityIllustration className={className} />;
  }

  if (cityType === "countryside") {
    return <CountrysideCityIllustration className={className} />;
  }

  if (cityType === "standard") {
    return <StandardCityIllustration className={className} />;
  }

  // 3. Fallback: icône de localisation générique pour les villes non répertoriées
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className || "w-10 h-10"}>
      <rect width="64" height="64" rx="12" fill="#F3F4F6"/>
      <path
        d="M32 12C24.268 12 18 18.268 18 26C18 36 32 52 32 52C32 52 46 36 46 26C46 18.268 39.732 12 32 12Z"
        fill="#9CA3AF"
        stroke="#6B7280"
        strokeWidth="2"
      />
      <circle cx="32" cy="26" r="6" fill="#F3F4F6" stroke="#6B7280" strokeWidth="2"/>
    </svg>
  );
};

export default CityIllustration;
