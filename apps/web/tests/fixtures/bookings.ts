/**
 * Fixtures réservations pour les tests E2E
 */

import { addDays, addHours } from 'date-fns';

export interface TestBooking {
  startDate: Date;
  endDate: Date;
  guests: number;
  message?: string;
}

export const testBookings = {
  // Réservation de 3 heures demain
  shortTerm: {
    startDate: addHours(addDays(new Date(), 1), 10), // Demain 10h
    endDate: addHours(addDays(new Date(), 1), 13),   // Demain 13h
    guests: 2,
    message: 'Réservation pour un shooting photo',
  },

  // Réservation d'une journée dans 3 jours
  dayBooking: {
    startDate: addHours(addDays(new Date(), 3), 9),  // Dans 3 jours à 9h
    endDate: addHours(addDays(new Date(), 3), 18),   // Dans 3 jours à 18h
    guests: 4,
    message: 'Réservation pour un événement',
  },

  // Réservation de plusieurs jours dans une semaine
  multiDay: {
    startDate: addHours(addDays(new Date(), 7), 14),  // Dans 7 jours à 14h
    endDate: addHours(addDays(new Date(), 10), 12),   // Dans 10 jours à 12h
    guests: 6,
    message: 'Réservation pour un tournage de plusieurs jours',
  },

  // Réservation avec réduction (7+ jours)
  longTerm: {
    startDate: addDays(new Date(), 14),
    endDate: addDays(new Date(), 21),
    guests: 4,
    message: 'Réservation longue durée',
  },
};

export const getTestBooking = (type: keyof typeof testBookings) => {
  return testBookings[type];
};

/**
 * Génère une réservation personnalisée
 */
export const createCustomBooking = (
  daysFromNow: number,
  durationHours: number,
  guests: number = 2
): TestBooking => {
  const startDate = addHours(addDays(new Date(), daysFromNow), 10);
  const endDate = addHours(startDate, durationHours);

  return {
    startDate,
    endDate,
    guests,
    message: `Réservation de test pour ${durationHours}h`,
  };
};
