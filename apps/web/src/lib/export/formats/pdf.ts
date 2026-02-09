/**
 * Générateur de format PDF pour l'export de données
 */

import { jsPDF } from "jspdf";
import type { UserDataExport } from "../user-data";

/**
 * Génère un rapport PDF lisible avec mise en page
 */
export function generatePDF(userData: UserDataExport): Buffer {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  // Helper pour ajouter une nouvelle page si nécessaire
  const checkPageBreak = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Helper pour ajouter du texte
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    checkPageBreak();
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.text(text, margin, yPosition);
    yPosition += lineHeight;
  };

  // Helper pour ajouter une section
  const addSection = (title: string) => {
    checkPageBreak(15);
    yPosition += 5;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPosition);
    yPosition += 10;
  };

  // Page de garde
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Export de Données Personnelles", margin, 40);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Lok'Room - Conforme RGPD Article 20", margin, 55);

  doc.setFontSize(10);
  doc.text(`Date d'export: ${new Date(userData.exportDate).toLocaleString("fr-FR")}`, margin, 70);
  doc.text(`Version: ${userData.exportVersion}`, margin, 77);

  // Nouvelle page pour le contenu
  doc.addPage();
  yPosition = 20;

  // Table des matières
  addSection("Table des Matières");
  addText("1. Informations du Compte");
  addText("2. Profil Utilisateur");
  if (userData.hostProfile) addText("3. Profil Hôte");
  if (userData.listings.length > 0) addText("4. Annonces");
  if (userData.bookingsAsGuest.length > 0) addText("5. Réservations (Voyageur)");
  if (userData.bookingsAsHost.length > 0) addText("6. Réservations (Hôte)");
  if (userData.reviewsGiven.length > 0) addText("7. Avis Donnés");
  if (userData.reviewsReceived.length > 0) addText("8. Avis Reçus");
  if (userData.messages.length > 0) addText("9. Messages");
  if (userData.favorites.length > 0) addText("10. Favoris");
  if (userData.notifications.length > 0) addText("11. Notifications");
  if (userData.wallet) addText("12. Portefeuille");

  // Nouvelle page pour le contenu
  doc.addPage();
  yPosition = 20;

  // 1. Informations du Compte
  addSection("1. Informations du Compte");
  addText(`ID: ${userData.account.id}`);
  addText(`Email: ${userData.account.email}`);
  addText(`Nom: ${userData.account.name || "Non renseigné"}`);
  addText(`Rôle: ${userData.account.role}`);
  addText(`Pays: ${userData.account.country || "Non renseigné"}`);
  addText(`Date de création: ${new Date(userData.account.createdAt).toLocaleDateString("fr-FR")}`);
  addText(`Dernière connexion: ${userData.account.lastLoginAt ? new Date(userData.account.lastLoginAt).toLocaleDateString("fr-FR") : "Jamais"}`);
  addText(`Statut d'identité: ${userData.account.identityStatus}`);
  addText(`Email vérifié: ${userData.account.emailVerified ? "Oui" : "Non"}`);
  addText(`2FA activé: ${userData.twoFactorEnabled ? "Oui" : "Non"}`);

  // 2. Profil Utilisateur
  if (userData.profile) {
    addSection("2. Profil Utilisateur");
    addText(`Prénom: ${userData.profile.firstName || "Non renseigné"}`);
    addText(`Nom: ${userData.profile.lastName || "Non renseigné"}`);
    addText(`Téléphone: ${userData.profile.phone || "Non renseigné"}`);
    addText(`Ville: ${userData.profile.city || "Non renseigné"}`);
    addText(`Pays: ${userData.profile.country || "Non renseigné"}`);
    addText(`Code postal: ${userData.profile.postalCode || "Non renseigné"}`);
    addText(`Note moyenne: ${userData.profile.ratingAvg.toFixed(1)} (${userData.profile.ratingCount} avis)`);
    addText(`Langue préférée: ${userData.profile.preferredLanguage}`);
    addText(`Traduction automatique: ${userData.profile.autoTranslate ? "Activée" : "Désactivée"}`);
  }

  // 3. Profil Hôte
  if (userData.hostProfile) {
    addSection("3. Profil Hôte");
    addText(`Superhost: ${userData.hostProfile.superhost ? "Oui" : "Non"}`);
    addText(`Email vérifié: ${userData.hostProfile.verifiedEmail ? "Oui" : "Non"}`);
    addText(`Téléphone vérifié: ${userData.hostProfile.verifiedPhone ? "Oui" : "Non"}`);
    addText(`Années d'expérience: ${userData.hostProfile.experienceYears || "Non renseigné"}`);
    addText(`Statut KYC: ${userData.hostProfile.kycStatus}`);
    addText(`Paiements activés: ${userData.hostProfile.payoutsEnabled ? "Oui" : "Non"}`);
    addText(`Langues: ${userData.hostProfile.languages.join(", ") || "Non renseigné"}`);
  }

  // 4. Annonces
  if (userData.listings.length > 0) {
    addSection("4. Annonces");
    addText(`Nombre total: ${userData.listings.length}`, 10, true);

    userData.listings.slice(0, 10).forEach((listing, index) => {
      checkPageBreak(30);
      addText(`\nAnnonce ${index + 1}:`, 10, true);
      addText(`  Titre: ${listing.title}`);
      addText(`  Type: ${listing.type}`);
      addText(`  Ville: ${listing.city}, ${listing.country}`);
      addText(`  Prix: ${listing.price} ${listing.currency}${listing.hourlyPrice ? ` / ${listing.hourlyPrice} ${listing.currency}/h` : ""}`);
      addText(`  Capacité: ${listing.maxGuests || "Non spécifié"} voyageurs`);
      addText(`  Note: ${listing.rating.toFixed(1)} - Vues: ${listing.viewCount}`);
      addText(`  Statut: ${listing.isActive ? "Active" : "Inactive"}`);
      addText(`  Images: ${listing.images.length} - Équipements: ${listing.amenities.length}`);
    });

    if (userData.listings.length > 10) {
      addText(`\n... et ${userData.listings.length - 10} autres annonces`);
    }
  }

  // 5. Réservations (Voyageur)
  if (userData.bookingsAsGuest.length > 0) {
    addSection("5. Réservations (Voyageur)");
    addText(`Nombre total: ${userData.bookingsAsGuest.length}`, 10, true);

    userData.bookingsAsGuest.slice(0, 10).forEach((booking, index) => {
      checkPageBreak(25);
      addText(`\nRéservation ${index + 1}:`, 10, true);
      addText(`  Annonce: ${booking.listing.title}`);
      addText(`  Lieu: ${booking.listing.city}, ${booking.listing.country}`);
      addText(`  Dates: ${new Date(booking.startDate).toLocaleDateString("fr-FR")} - ${new Date(booking.endDate).toLocaleDateString("fr-FR")}`);
      addText(`  Prix: ${booking.totalPrice} ${booking.currency}`);
      addText(`  Statut: ${booking.status}`);
      addText(`  Mode: ${booking.pricingMode}`);
    });

    if (userData.bookingsAsGuest.length > 10) {
      addText(`\n... et ${userData.bookingsAsGuest.length - 10} autres réservations`);
    }
  }

  // 6. Réservations (Hôte)
  if (userData.bookingsAsHost.length > 0) {
    addSection("6. Réservations (Hôte)");
    addText(`Nombre total: ${userData.bookingsAsHost.length}`, 10, true);

    userData.bookingsAsHost.slice(0, 10).forEach((booking, index) => {
      checkPageBreak(25);
      addText(`\nRéservation ${index + 1}:`, 10, true);
      addText(`  Annonce: ${booking.listing.title}`);
      addText(`  Voyageur: ${booking.guest.name || booking.guest.email}`);
      addText(`  Dates: ${new Date(booking.startDate).toLocaleDateString("fr-FR")} - ${new Date(booking.endDate).toLocaleDateString("fr-FR")}`);
      addText(`  Prix: ${booking.totalPrice} ${booking.currency}`);
      addText(`  Statut: ${booking.status}`);
    });

    if (userData.bookingsAsHost.length > 10) {
      addText(`\n... et ${userData.bookingsAsHost.length - 10} autres réservations`);
    }
  }

  // 7. Avis Donnés
  if (userData.reviewsGiven.length > 0) {
    addSection("7. Avis Donnés");
    addText(`Nombre total: ${userData.reviewsGiven.length}`, 10, true);

    userData.reviewsGiven.slice(0, 5).forEach((review, index) => {
      checkPageBreak(30);
      addText(`\nAvis ${index + 1}:`, 10, true);
      addText(`  Annonce: ${review.listing.title}`);
      addText(`  Note: ${review.rating}/5`);
      if (review.comment) {
        const comment = review.comment.length > 100 ? review.comment.substring(0, 100) + "..." : review.comment;
        addText(`  Commentaire: ${comment}`);
      }
      addText(`  Date: ${new Date(review.createdAt).toLocaleDateString("fr-FR")}`);
    });

    if (userData.reviewsGiven.length > 5) {
      addText(`\n... et ${userData.reviewsGiven.length - 5} autres avis`);
    }
  }

  // 8. Avis Reçus
  if (userData.reviewsReceived.length > 0) {
    addSection("8. Avis Reçus");
    addText(`Nombre total: ${userData.reviewsReceived.length}`, 10, true);

    const avgRating = userData.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / userData.reviewsReceived.length;
    addText(`Note moyenne: ${avgRating.toFixed(1)}/5`, 10, true);

    userData.reviewsReceived.slice(0, 5).forEach((review, index) => {
      checkPageBreak(25);
      addText(`\nAvis ${index + 1}:`, 10, true);
      addText(`  Auteur: ${review.author.name || "Anonyme"}`);
      addText(`  Note: ${review.rating}/5`);
      if (review.comment) {
        const comment = review.comment.length > 100 ? review.comment.substring(0, 100) + "..." : review.comment;
        addText(`  Commentaire: ${comment}`);
      }
      addText(`  Date: ${new Date(review.createdAt).toLocaleDateString("fr-FR")}`);
    });

    if (userData.reviewsReceived.length > 5) {
      addText(`\n... et ${userData.reviewsReceived.length - 5} autres avis`);
    }
  }

  // 9. Messages
  if (userData.messages.length > 0) {
    addSection("9. Messages");
    addText(`Nombre total: ${userData.messages.length}`, 10, true);
    addText(`Messages lus: ${userData.messages.filter(m => m.readAt).length}`);
    addText(`Messages non lus: ${userData.messages.filter(m => !m.readAt).length}`);
  }

  // 10. Favoris
  if (userData.favorites.length > 0) {
    addSection("10. Favoris");
    addText(`Nombre total: ${userData.favorites.length}`, 10, true);

    userData.favorites.slice(0, 10).forEach((fav, index) => {
      checkPageBreak(15);
      addText(`${index + 1}. ${fav.listing.title} (${fav.listing.city}, ${fav.listing.country})`);
    });

    if (userData.favorites.length > 10) {
      addText(`... et ${userData.favorites.length - 10} autres favoris`);
    }
  }

  // 11. Notifications
  if (userData.notifications.length > 0) {
    addSection("11. Notifications");
    addText(`Nombre total: ${userData.notifications.length}`, 10, true);
    addText(`Notifications lues: ${userData.notifications.filter(n => n.read).length}`);
    addText(`Notifications non lues: ${userData.notifications.filter(n => !n.read).length}`);
  }

  // 12. Portefeuille
  if (userData.wallet) {
    addSection("12. Portefeuille");
    addText(`Solde: ${(userData.wallet.balanceCents / 100).toFixed(2)} EUR`, 10, true);
    addText(`Nombre de transactions: ${userData.wallet.transactions.length}`);
  }

  // Pied de page sur toutes les pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${i} sur ${totalPages} - Export généré le ${new Date().toLocaleDateString("fr-FR")}`,
      margin,
      pageHeight - 10
    );
  }

  // Convertir en Buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
