// Informations sur chaque type de badge
export const badgeInfo: Record<
  string,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  IDENTITY_VERIFIED: {
    name: "Identité vérifiée",
    description: "A vérifié son identité avec une pièce officielle",
    icon: "🛡️",
    color: "bg-blue-100 text-blue-800",
  },
  EMAIL_VERIFIED: {
    name: "Email vérifié",
    description: "A confirmé son adresse email",
    icon: "✉️",
    color: "bg-green-100 text-green-800",
  },
  PHONE_VERIFIED: {
    name: "Téléphone vérifié",
    description: "A confirmé son numéro de téléphone",
    icon: "📱",
    color: "bg-purple-100 text-purple-800",
  },
  SUPERHOST: {
    name: "Superhost",
    description: "Hôte d'exception avec des évaluations exceptionnelles",
    icon: "🏆",
    color: "bg-amber-100 text-amber-800",
  },
  EXPERIENCED_HOST: {
    name: "Hôte expérimenté",
    description: "A accueilli plus de 10 voyageurs",
    icon: "⭐",
    color: "bg-yellow-100 text-yellow-800",
  },
  QUICK_RESPONDER: {
    name: "Répond rapidement",
    description: "Répond généralement en moins d'une heure",
    icon: "⚡",
    color: "bg-orange-100 text-orange-800",
  },
  HIGHLY_RATED: {
    name: "Très bien noté",
    description: "Maintient une note moyenne de 4.8+",
    icon: "🌟",
    color: "bg-rose-100 text-rose-800",
  },
  TRUSTED_GUEST: {
    name: "Voyageur de confiance",
    description: "Voyageur avec un excellent historique",
    icon: "✅",
    color: "bg-teal-100 text-teal-800",
  },
  EARLY_ADOPTER: {
    name: "Pionnier",
    description: "Parmi les premiers utilisateurs de Lok'Room",
    icon: "🚀",
    color: "bg-indigo-100 text-indigo-800",
  },
  TOP_CONTRIBUTOR: {
    name: "Top contributeur",
    description: "Contributeur actif de la communauté",
    icon: "💎",
    color: "bg-pink-100 text-pink-800",
  },
};

// Liste des types de badges valides
export const BADGE_TYPES = Object.keys(badgeInfo);
