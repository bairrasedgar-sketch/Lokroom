/**
 * Fixtures annonces pour les tests E2E
 */

export interface TestListing {
  title: string;
  description: string;
  spaceType: string;
  address: string;
  city: string;
  country: string;
  price: number;
  capacity: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities: string[];
}

export const testListings = {
  apartment: {
    title: 'Appartement Test Cosy Centre-Ville',
    description: 'Magnifique appartement pour vos événements et tournages',
    spaceType: 'APARTMENT',
    address: '123 Rue de Test',
    city: 'Paris',
    country: 'France',
    postalCode: '75001',
    price: 50,
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['WiFi', 'Cuisine équipée', 'Climatisation'],
    highlights: ['Vue panoramique', 'Lumineux', 'Bien situé'],
    spaceDescription: 'Un espace lumineux et moderne parfait pour vos projets.',
    guestAccessDescription: 'Accès complet à l\'appartement.',
    neighborhoodDescription: 'Quartier calme et bien desservi.',
  },

  studio: {
    title: 'Studio Photo Professionnel',
    description: 'Studio photo équipé pour vos shootings',
    spaceType: 'STUDIO',
    address: '456 Avenue du Studio',
    city: 'Lyon',
    country: 'France',
    postalCode: '69001',
    price: 80,
    capacity: 10,
    studioType: 'PHOTO_STUDIO',
    height: 4.5,
    greenScreen: true,
    soundproofing: true,
    amenities: ['Éclairage professionnel', 'Fond blanc', 'WiFi'],
    highlights: ['Équipement pro', 'Grande hauteur sous plafond'],
    spaceDescription: 'Studio professionnel avec tout l\'équipement nécessaire.',
  },

  house: {
    title: 'Maison avec Jardin',
    description: 'Belle maison avec jardin pour événements',
    spaceType: 'HOUSE',
    address: '789 Chemin de la Maison',
    city: 'Marseille',
    country: 'France',
    postalCode: '13001',
    price: 120,
    capacity: 8,
    bedrooms: 3,
    bathrooms: 2,
    floors: 2,
    garden: true,
    pool: true,
    poolHeated: true,
    terrace: true,
    amenities: ['WiFi', 'Cuisine équipée', 'Barbecue', 'Parking'],
    highlights: ['Piscine chauffée', 'Grand jardin', 'Terrasse'],
    spaceDescription: 'Maison spacieuse avec tous les équipements.',
  },

  parking: {
    title: 'Parking Sécurisé Centre',
    description: 'Place de parking couverte et sécurisée',
    spaceType: 'PARKING',
    address: '321 Rue du Parking',
    city: 'Toulouse',
    country: 'France',
    postalCode: '31000',
    price: 10,
    capacity: 1,
    parkingType: 'COVERED',
    covered: true,
    secured: true,
    evCharger: true,
    dimensions: '5m x 2.5m',
    amenities: ['Borne électrique', 'Vidéosurveillance'],
    highlights: ['Sécurisé 24/7', 'Borne de recharge'],
  },
};

export const getTestListing = (type: keyof typeof testListings) => {
  return testListings[type];
};
