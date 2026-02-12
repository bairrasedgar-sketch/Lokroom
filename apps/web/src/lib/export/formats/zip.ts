/**
 * Générateur de format ZIP pour l'export de données
 * Inclut JSON, CSV et toutes les photos
 */

import JSZip from "jszip";
import type { UserDataExport } from "../user-data";
import { generateJSON } from "./json";
import { generateCSV } from "./csv";
import { logger } from "@/lib/logger";


/**
 * Génère un fichier ZIP contenant tous les formats et les photos
 */
export async function generateZIP(userData: UserDataExport): Promise<Buffer> {
  const zip = new JSZip();

  // 1. Ajouter le fichier JSON
  zip.file("data.json", generateJSON(userData));

  // 2. Ajouter les fichiers CSV dans un dossier
  const csvFiles = generateCSV(userData);
  const csvFolder = zip.folder("csv");
  if (csvFolder) {
    Object.entries(csvFiles).forEach(([filename, content]) => {
      csvFolder.file(filename, content);
    });
  }

  // 3. Ajouter un fichier README
  const readme = `# Export de Données Personnelles Lok'Room

Date d'export: ${new Date(userData.exportDate).toLocaleString("fr-FR")}
Version: ${userData.exportVersion}

## Contenu de cet export

### Fichiers principaux
- **data.json**: Toutes vos données au format JSON (machine-readable)
- **csv/**: Vos données au format CSV (compatible Excel/Google Sheets)
- **photos/**: Toutes les photos de vos annonces

### Données incluses
- Informations du compte
- Profil utilisateur
${userData.hostProfile ? "- Profil hôte\n" : ""}${userData.listings.length > 0 ? `- ${userData.listings.length} annonce(s)\n` : ""}${userData.bookingsAsGuest.length > 0 ? `- ${userData.bookingsAsGuest.length} réservation(s) en tant que voyageur\n` : ""}${userData.bookingsAsHost.length > 0 ? `- ${userData.bookingsAsHost.length} réservation(s) en tant qu'hôte\n` : ""}${userData.reviewsGiven.length > 0 ? `- ${userData.reviewsGiven.length} avis donné(s)\n` : ""}${userData.reviewsReceived.length > 0 ? `- ${userData.reviewsReceived.length} avis reçu(s)\n` : ""}${userData.messages.length > 0 ? `- ${userData.messages.length} message(s)\n` : ""}${userData.favorites.length > 0 ? `- ${userData.favorites.length} favori(s)\n` : ""}${userData.notifications.length > 0 ? `- ${userData.notifications.length} notification(s)\n` : ""}${userData.wallet ? "- Portefeuille et transactions\n" : ""}
## Conformité RGPD

Cet export est conforme à l'Article 20 du RGPD (Droit à la portabilité des données).
Vous pouvez utiliser ces données pour:
- Les transférer vers un autre service
- Les archiver pour vos dossiers personnels
- Les analyser avec vos propres outils

## Support

Pour toute question concernant cet export, contactez-nous à:
support@lokroom.com

---
Lok'Room - Plateforme de location d'espaces
`;

  zip.file("README.md", readme);

  // 4. Télécharger et ajouter toutes les photos des annonces
  const photosFolder = zip.folder("photos");
  if (photosFolder && userData.listings.length > 0) {
    let photoCount = 0;
    const maxPhotos = 100; // Limiter à 100 photos pour éviter un fichier trop lourd

    for (const listing of userData.listings) {
      if (photoCount >= maxPhotos) break;

      const listingFolder = photosFolder.folder(listing.id);
      if (!listingFolder) continue;

      for (const image of listing.images) {
        if (photoCount >= maxPhotos) break;

        try {
          // Télécharger l'image
          const response = await fetch(image.url);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Extraire l'extension du fichier
            const urlParts = image.url.split(".");
            const extension = urlParts[urlParts.length - 1].split("?")[0] || "jpg";

            // Nom du fichier: position_cover.extension
            const filename = `${image.position}_${image.isCover ? "cover" : "image"}.${extension}`;
            listingFolder.file(filename, buffer);

            photoCount++;
          }
        } catch (error) {
          logger.error(`Erreur téléchargement photo ${image.url}:`, error);
          // Continuer même si une photo échoue
        }
      }
    }

    // Ajouter un fichier d'information sur les photos
    if (photoCount > 0) {
      photosFolder.file(
        "INFO.txt",
        `${photoCount} photo(s) incluse(s) dans cet export.\n\nOrganisation:\n- Chaque dossier correspond à une annonce (ID de l'annonce)\n- Les fichiers sont nommés: position_type.extension\n- Les photos de couverture sont marquées "cover"\n`
      );
    }
  }

  // 5. Ajouter un fichier de métadonnées
  const metadata = {
    exportDate: userData.exportDate,
    exportVersion: userData.exportVersion,
    userId: userData.account.id,
    userEmail: userData.account.email,
    statistics: {
      listings: userData.listings.length,
      bookingsAsGuest: userData.bookingsAsGuest.length,
      bookingsAsHost: userData.bookingsAsHost.length,
      reviewsGiven: userData.reviewsGiven.length,
      reviewsReceived: userData.reviewsReceived.length,
      messages: userData.messages.length,
      favorites: userData.favorites.length,
      notifications: userData.notifications.length,
      photos: userData.listings.reduce((sum, l) => sum + l.images.length, 0),
    },
  };

  zip.file("metadata.json", JSON.stringify(metadata, null, 2));

  // Générer le ZIP
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9, // Compression maximale
    },
  });

  return zipBuffer;
}

/**
 * Génère un fichier ZIP sans les photos (plus rapide)
 */
export async function generateZIPWithoutPhotos(userData: UserDataExport): Promise<Buffer> {
  const zip = new JSZip();

  // Ajouter JSON
  zip.file("data.json", generateJSON(userData));

  // Ajouter CSV
  const csvFiles = generateCSV(userData);
  const csvFolder = zip.folder("csv");
  if (csvFolder) {
    Object.entries(csvFiles).forEach(([filename, content]) => {
      csvFolder.file(filename, content);
    });
  }

  // Ajouter README simplifié
  const readme = `# Export de Données Personnelles Lok'Room (Sans Photos)

Date d'export: ${new Date(userData.exportDate).toLocaleString("fr-FR")}
Version: ${userData.exportVersion}

Cet export ne contient pas les photos pour réduire la taille du fichier.
Pour obtenir un export complet avec photos, sélectionnez le format "ZIP (avec photos)".
`;

  zip.file("README.md", readme);

  // Générer le ZIP
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  });

  return zipBuffer;
}
