// apps/web/src/lib/i18n.ts
const messages = {
  fr: {
    listings: "Annonces",
    back: "← Retour aux annonces",
    host: "Hôte",
    noImage: "Pas d’image",
    publishedOn: "Publié le",
  },
  en: {
    listings: "Listings",
    back: "← Back to listings",
    host: "Host",
    noImage: "No image",
    publishedOn: "Published on",
  },
};

export type Locale = "fr" | "en";

export function t(key: keyof typeof messages["fr"], locale: Locale): string {
  return messages[locale][key] ?? key;
}
