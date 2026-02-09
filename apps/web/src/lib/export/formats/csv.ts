/**
 * Générateur de format CSV pour l'export de données
 */

import type { UserDataExport } from "../user-data";

/**
 * Convertit un tableau d'objets en CSV
 */
function arrayToCSV(data: Array<Record<string, unknown>>, headers: string[]): string {
  if (data.length === 0) return "";

  const csvRows: string[] = [];

  // En-têtes
  csvRows.push(headers.map(h => `"${h}"`).join(","));

  // Données
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '""';
      if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Génère plusieurs fichiers CSV pour l'export
 */
export function generateCSV(userData: UserDataExport): Record<string, string> {
  const files: Record<string, string> = {};

  // 1. Profil utilisateur
  files["profile.csv"] = arrayToCSV(
    [
      {
        id: userData.account.id,
        email: userData.account.email,
        name: userData.account.name,
        role: userData.account.role,
        country: userData.account.country,
        createdAt: userData.account.createdAt,
        lastLoginAt: userData.account.lastLoginAt,
        identityStatus: userData.account.identityStatus,
        emailVerified: userData.account.emailVerified,
        firstName: userData.profile?.firstName,
        lastName: userData.profile?.lastName,
        phone: userData.profile?.phone,
        city: userData.profile?.city,
        birthDate: userData.profile?.birthDate,
        ratingAvg: userData.profile?.ratingAvg,
        ratingCount: userData.profile?.ratingCount,
      },
    ],
    [
      "id",
      "email",
      "name",
      "role",
      "country",
      "createdAt",
      "lastLoginAt",
      "identityStatus",
      "emailVerified",
      "firstName",
      "lastName",
      "phone",
      "city",
      "birthDate",
      "ratingAvg",
      "ratingCount",
    ]
  );

  // 2. Annonces
  if (userData.listings.length > 0) {
    files["listings.csv"] = arrayToCSV(
      userData.listings.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        price: l.price,
        hourlyPrice: l.hourlyPrice,
        currency: l.currency,
        type: l.type,
        city: l.city,
        country: l.country,
        maxGuests: l.maxGuests,
        isActive: l.isActive,
        rating: l.rating,
        viewCount: l.viewCount,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        imagesCount: l.images.length,
        amenitiesCount: l.amenities.length,
      })),
      [
        "id",
        "title",
        "description",
        "price",
        "hourlyPrice",
        "currency",
        "type",
        "city",
        "country",
        "maxGuests",
        "isActive",
        "rating",
        "viewCount",
        "createdAt",
        "updatedAt",
        "imagesCount",
        "amenitiesCount",
      ]
    );
  }

  // 3. Réservations (en tant que voyageur)
  if (userData.bookingsAsGuest.length > 0) {
    files["bookings_as_guest.csv"] = arrayToCSV(
      userData.bookingsAsGuest.map((b) => ({
        id: b.id,
        startDate: b.startDate,
        endDate: b.endDate,
        totalPrice: b.totalPrice,
        currency: b.currency,
        status: b.status,
        pricingMode: b.pricingMode,
        createdAt: b.createdAt,
        listingTitle: b.listing.title,
        listingCity: b.listing.city,
        listingCountry: b.listing.country,
      })),
      [
        "id",
        "startDate",
        "endDate",
        "totalPrice",
        "currency",
        "status",
        "pricingMode",
        "createdAt",
        "listingTitle",
        "listingCity",
        "listingCountry",
      ]
    );
  }

  // 4. Réservations (en tant qu'hôte)
  if (userData.bookingsAsHost.length > 0) {
    files["bookings_as_host.csv"] = arrayToCSV(
      userData.bookingsAsHost.map((b) => ({
        id: b.id,
        startDate: b.startDate,
        endDate: b.endDate,
        totalPrice: b.totalPrice,
        currency: b.currency,
        status: b.status,
        createdAt: b.createdAt,
        guestName: b.guest.name,
        guestEmail: b.guest.email,
        listingTitle: b.listing.title,
      })),
      [
        "id",
        "startDate",
        "endDate",
        "totalPrice",
        "currency",
        "status",
        "createdAt",
        "guestName",
        "guestEmail",
        "listingTitle",
      ]
    );
  }

  // 5. Avis donnés
  if (userData.reviewsGiven.length > 0) {
    files["reviews_given.csv"] = arrayToCSV(
      userData.reviewsGiven.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        type: r.type,
        status: r.status,
        ratingCleanliness: r.ratingCleanliness,
        ratingAccuracy: r.ratingAccuracy,
        ratingCommunication: r.ratingCommunication,
        ratingLocation: r.ratingLocation,
        ratingCheckin: r.ratingCheckin,
        ratingValue: r.ratingValue,
        wouldRecommend: r.wouldRecommend,
        createdAt: r.createdAt,
        listingTitle: r.listing.title,
      })),
      [
        "id",
        "rating",
        "comment",
        "type",
        "status",
        "ratingCleanliness",
        "ratingAccuracy",
        "ratingCommunication",
        "ratingLocation",
        "ratingCheckin",
        "ratingValue",
        "wouldRecommend",
        "createdAt",
        "listingTitle",
      ]
    );
  }

  // 6. Avis reçus
  if (userData.reviewsReceived.length > 0) {
    files["reviews_received.csv"] = arrayToCSV(
      userData.reviewsReceived.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt,
        authorName: r.author.name,
      })),
      ["id", "rating", "comment", "type", "status", "createdAt", "authorName"]
    );
  }

  // 7. Messages
  if (userData.messages.length > 0) {
    files["messages.csv"] = arrayToCSV(
      userData.messages.map((m) => ({
        conversationId: m.conversationId,
        content: m.content,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
      ["conversationId", "content", "createdAt", "readAt"]
    );
  }

  // 8. Favoris
  if (userData.favorites.length > 0) {
    files["favorites.csv"] = arrayToCSV(
      userData.favorites.map((f) => ({
        listingId: f.listingId,
        createdAt: f.createdAt,
        listingTitle: f.listing.title,
        listingCity: f.listing.city,
        listingCountry: f.listing.country,
      })),
      ["listingId", "createdAt", "listingTitle", "listingCity", "listingCountry"]
    );
  }

  // 9. Notifications
  if (userData.notifications.length > 0) {
    files["notifications.csv"] = arrayToCSV(
      userData.notifications.map((n) => ({
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt,
      })),
      ["type", "title", "message", "read", "createdAt"]
    );
  }

  // 10. Historique de recherche
  if (userData.searchHistory.length > 0) {
    files["search_history.csv"] = arrayToCSV(
      userData.searchHistory.map((s) => ({
        destination: s.destination,
        startDate: s.startDate,
        endDate: s.endDate,
        guests: s.guests,
        createdAt: s.createdAt,
      })),
      ["destination", "startDate", "endDate", "guests", "createdAt"]
    );
  }

  // 11. Paiements
  if (userData.payments.length > 0) {
    files["payments.csv"] = arrayToCSV(
      userData.payments.map((p) => ({
        bookingId: p.bookingId,
        amountCents: p.amountCents,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
      })),
      ["bookingId", "amountCents", "currency", "status", "createdAt"]
    );
  }

  // 12. Litiges
  if (userData.disputes.length > 0) {
    files["disputes.csv"] = arrayToCSV(
      userData.disputes.map((d) => ({
        id: d.id,
        reason: d.reason,
        status: d.status,
        description: d.description,
        claimedAmountCents: d.claimedAmountCents,
        awardedAmountCents: d.awardedAmountCents,
        resolution: d.resolution,
        createdAt: d.createdAt,
        resolvedAt: d.resolvedAt,
      })),
      [
        "id",
        "reason",
        "status",
        "description",
        "claimedAmountCents",
        "awardedAmountCents",
        "resolution",
        "createdAt",
        "resolvedAt",
      ]
    );
  }

  // 13. Consentements
  if (userData.consents.length > 0) {
    files["consents.csv"] = arrayToCSV(
      userData.consents.map((c) => ({
        type: c.type,
        version: c.version,
        accepted: c.accepted,
        ipAddress: c.ipAddress,
        createdAt: c.createdAt,
      })),
      ["type", "version", "accepted", "ipAddress", "createdAt"]
    );
  }

  // 14. Wallet
  if (userData.wallet) {
    files["wallet.csv"] = arrayToCSV(
      [
        {
          balanceCents: userData.wallet.balanceCents,
          transactionsCount: userData.wallet.transactions.length,
        },
      ],
      ["balanceCents", "transactionsCount"]
    );

    if (userData.wallet.transactions.length > 0) {
      files["wallet_transactions.csv"] = arrayToCSV(
        userData.wallet.transactions.map((t) => ({
          deltaCents: t.deltaCents,
          reason: t.reason,
          createdAt: t.createdAt,
        })),
        ["deltaCents", "reason", "createdAt"]
      );
    }
  }

  return files;
}
