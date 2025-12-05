import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Images libres de droit par catégorie (Unsplash)
const IMAGES = {
  APARTMENT: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800",
    "https://images.unsplash.com/photo-1484154218962-a197022b25ba?w=800",
  ],
  HOUSE: [
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
  ],
  ROOM: [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
  ],
  STUDIO: [
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
    "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=800",
    "https://images.unsplash.com/photo-1572883454114-1cf0031ede2a?w=800",
    "https://images.unsplash.com/photo-1540655037529-dec987208707?w=800",
  ],
  OFFICE: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
    "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
    "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800",
    "https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=800",
  ],
  COWORKING: [
    "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800",
    "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800",
    "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800",
  ],
  MEETING_ROOM: [
    "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800",
    "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800",
    "https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800",
    "https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=800",
    "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
    "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800",
  ],
  PARKING: [
    "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800",
    "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800",
    "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800",
    "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=800",
    "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=800",
  ],
  GARAGE: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=800",
    "https://images.unsplash.com/photo-1597766659675-92ae7a445988?w=800",
    "https://images.unsplash.com/photo-1625773595773-c8a116c7d56a?w=800",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
  ],
  STORAGE: [
    "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
  ],
  EVENT_SPACE: [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800",
    "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
  ],
  RECORDING_STUDIO: [
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
    "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800",
    "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800",
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800",
    "https://images.unsplash.com/photo-1558618047-f4b511b67309?w=800",
    "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800",
  ],
  OTHER: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
    "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  ],
};

// Données des annonces par catégorie
const LISTINGS_DATA = [
  // APARTMENT
  {
    type: "APARTMENT" as const,
    france: {
      title: "Appartement moderne avec vue sur la Tour Eiffel",
      description: "Magnifique appartement de 70m² situé dans le 7ème arrondissement de Paris. Vue imprenable sur la Tour Eiffel, entièrement rénové avec des finitions haut de gamme. Cuisine équipée, 2 chambres, salon lumineux. Idéal pour un séjour romantique ou un voyage d'affaires.",
      city: "Paris",
      regionFR: "IDF",
      price: 180,
      maxGuests: 4,
      beds: 2,
      bathrooms: 1,
      lat: 48.8584,
      lng: 2.2945,
    },
    canada: {
      title: "Condo de luxe au cœur du Vieux-Montréal",
      description: "Superbe condo moderne de 85m² dans un immeuble historique du Vieux-Montréal. Plafonds hauts, briques apparentes, grandes fenêtres. À deux pas des meilleurs restaurants et attractions. Parfait pour découvrir la ville.",
      city: "Montréal",
      province: "QC" as const,
      price: 165,
      maxGuests: 4,
      beds: 2,
      bathrooms: 1,
      lat: 45.5048,
      lng: -73.5538,
    },
  },
  // HOUSE
  {
    type: "HOUSE" as const,
    france: {
      title: "Villa provençale avec piscine",
      description: "Charmante villa de 150m² au cœur de la Provence. Jardin méditerranéen de 1000m², piscine privée, terrasse ombragée. 4 chambres spacieuses, cuisine provençale équipée. Vue sur les vignobles. Calme absolu à 15min d'Aix-en-Provence.",
      city: "Aix-en-Provence",
      regionFR: "PAC",
      price: 280,
      maxGuests: 8,
      beds: 4,
      bathrooms: 2,
      lat: 43.5297,
      lng: 5.4474,
    },
    canada: {
      title: "Maison victorienne à Toronto",
      description: "Élégante maison victorienne entièrement rénovée dans le quartier historique de Cabbagetown. Charme d'époque avec tout le confort moderne. 3 étages, jardin privé, proche du centre-ville. Idéale pour les familles.",
      city: "Toronto",
      province: "ON" as const,
      price: 320,
      maxGuests: 6,
      beds: 3,
      bathrooms: 2,
      lat: 43.6677,
      lng: -79.3650,
    },
  },
  // ROOM
  {
    type: "ROOM" as const,
    france: {
      title: "Chambre cosy dans maison d'artiste",
      description: "Chambre privée de 18m² dans une maison d'artiste à Montmartre. Décoration bohème, lit queen size très confortable. Salle de bain partagée. Petit-déjeuner inclus. Ambiance chaleureuse et authentique.",
      city: "Paris",
      regionFR: "IDF",
      price: 65,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      lat: 48.8867,
      lng: 2.3431,
    },
    canada: {
      title: "Chambre lumineuse près du Mont-Royal",
      description: "Belle chambre privée dans un appartement spacieux du Plateau Mont-Royal. Quartier animé, cafés et boutiques à proximité. Accès au parc Mont-Royal à pied. Hôte francophone et anglophone.",
      city: "Montréal",
      province: "QC" as const,
      price: 55,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      lat: 45.5225,
      lng: -73.5878,
    },
  },
  // STUDIO
  {
    type: "STUDIO" as const,
    france: {
      title: "Studio d'artiste dans le Marais",
      description: "Authentique studio d'artiste de 45m² avec verrière. Lumière naturelle exceptionnelle, idéal pour photographes, peintres ou créatifs. Équipement de base fourni. Quartier du Marais, très bien desservi.",
      city: "Paris",
      regionFR: "IDF",
      price: 95,
      maxGuests: 3,
      lat: 48.8566,
      lng: 2.3522,
    },
    canada: {
      title: "Studio créatif à Vancouver",
      description: "Espace créatif de 60m² dans le quartier artistique de Gastown. Parfait pour shootings photo, cours de yoga ou ateliers. Grande hauteur sous plafond, murs blancs, parquet ancien.",
      city: "Vancouver",
      province: "BC" as const,
      price: 110,
      maxGuests: 4,
      lat: 49.2827,
      lng: -123.1207,
    },
  },
  // OFFICE
  {
    type: "OFFICE" as const,
    france: {
      title: "Bureau privatif La Défense",
      description: "Bureau fermé de 25m² dans un espace de coworking premium à La Défense. Vue panoramique, climatisation, internet très haut débit. Accès 24/7, salles de réunion disponibles. Idéal pour professionnels.",
      city: "Paris",
      regionFR: "IDF",
      price: 85,
      maxGuests: 4,
      desks: 4,
      lat: 48.8924,
      lng: 2.2360,
    },
    canada: {
      title: "Bureau privé au centre-ville de Toronto",
      description: "Espace de bureau moderne de 30m² dans la tour financière. Mobilier ergonomique, internet fibre, services de conciergerie. Parfait pour équipes de 2-5 personnes. Metro accessible.",
      city: "Toronto",
      province: "ON" as const,
      price: 120,
      maxGuests: 5,
      desks: 5,
      lat: 43.6510,
      lng: -79.3470,
    },
  },
  // COWORKING
  {
    type: "COWORKING" as const,
    france: {
      title: "Espace coworking créatif Lyon",
      description: "Poste de travail dans un coworking design au cœur de Lyon. Communauté dynamique de freelances et startups. Café et thé inclus, événements networking réguliers. Ambiance inspirante.",
      city: "Lyon",
      regionFR: "ARA",
      price: 25,
      maxGuests: 1,
      desks: 1,
      lat: 45.7640,
      lng: 4.8357,
    },
    canada: {
      title: "Coworking avec vue sur le port de Vancouver",
      description: "Espace de travail partagé avec vue spectaculaire sur le port. Communauté internationale, événements hebdomadaires. Cuisine équipée, terrasse, douches. Flexibilité totale.",
      city: "Vancouver",
      province: "BC" as const,
      price: 35,
      maxGuests: 1,
      desks: 1,
      lat: 49.2849,
      lng: -123.1116,
    },
  },
  // MEETING_ROOM
  {
    type: "MEETING_ROOM" as const,
    france: {
      title: "Salle de réunion executive Bordeaux",
      description: "Salle de réunion haut de gamme pour 12 personnes. Écran 4K, visioconférence HD, tableau blanc interactif. Service traiteur disponible. Quartier des Chartrons, parking facile.",
      city: "Bordeaux",
      regionFR: "NAQ",
      price: 75,
      maxGuests: 12,
      lat: 44.8378,
      lng: -0.5792,
    },
    canada: {
      title: "Salle de conférence Ottawa",
      description: "Espace de réunion professionnel pouvant accueillir 20 personnes. Équipement audiovisuel complet, climatisation, accès handicapé. Proche du Parlement. Idéal pour formations et séminaires.",
      city: "Ottawa",
      province: "ON" as const,
      price: 95,
      maxGuests: 20,
      lat: 45.4215,
      lng: -75.6972,
    },
  },
  // PARKING
  {
    type: "PARKING" as const,
    france: {
      title: "Place de parking sécurisée Marseille",
      description: "Place de parking couverte et sécurisée dans le Vieux-Port de Marseille. Accès badge 24/7, vidéosurveillance. Idéal pour visiteurs ou résidents. À 2 min à pied des transports.",
      city: "Marseille",
      regionFR: "PAC",
      price: 12,
      parkings: 1,
      lat: 43.2965,
      lng: 5.3698,
    },
    canada: {
      title: "Stationnement intérieur centre-ville Calgary",
      description: "Place de stationnement chauffée au centre-ville de Calgary. Accès direct au réseau +15. Parfait pour l'hiver. Disponible long terme ou court terme.",
      city: "Calgary",
      province: "AB" as const,
      price: 18,
      parkings: 1,
      lat: 51.0447,
      lng: -114.0719,
    },
  },
  // GARAGE
  {
    type: "GARAGE" as const,
    france: {
      title: "Garage privé sécurisé Nice",
      description: "Grand garage fermé de 20m² dans résidence sécurisée à Nice. Idéal pour voiture de collection ou stockage. Électricité disponible. À 10 min de la Promenade des Anglais.",
      city: "Nice",
      regionFR: "PAC",
      price: 25,
      parkings: 1,
      lat: 43.7102,
      lng: 7.2620,
    },
    canada: {
      title: "Garage double chauffé Edmonton",
      description: "Grand garage double de 40m² entièrement chauffé. Parfait pour l'hiver canadien. Peut accueillir 2 véhicules ou servir d'atelier. Quartier résidentiel calme.",
      city: "Edmonton",
      province: "AB" as const,
      price: 40,
      parkings: 2,
      lat: 53.5461,
      lng: -113.4938,
    },
  },
  // STORAGE
  {
    type: "STORAGE" as const,
    france: {
      title: "Box de stockage Toulouse",
      description: "Espace de stockage sécurisé de 15m² à Toulouse. Accès facile, surveillance 24/7. Idéal pour meubles, archives ou matériel professionnel. Contrat flexible.",
      city: "Toulouse",
      regionFR: "OCC",
      price: 80,
      maxGuests: 1,
      lat: 43.6047,
      lng: 1.4442,
    },
    canada: {
      title: "Unité de stockage climatisée Québec",
      description: "Espace de rangement de 20m² avec contrôle de température et humidité. Parfait pour objets sensibles. Accès 7j/7, ascenseur pour charges lourdes.",
      city: "Québec",
      province: "QC" as const,
      price: 95,
      maxGuests: 1,
      lat: 46.8139,
      lng: -71.2080,
    },
  },
  // EVENT_SPACE
  {
    type: "EVENT_SPACE" as const,
    france: {
      title: "Loft événementiel Nantes",
      description: "Magnifique loft industriel de 200m² pour vos événements. Capacité 100 personnes debout. Cuisine professionnelle, sono intégrée, éclairage modulable. Parfait pour soirées, lancements, expositions.",
      city: "Nantes",
      regionFR: "PDL",
      price: 450,
      maxGuests: 100,
      lat: 47.2184,
      lng: -1.5536,
    },
    canada: {
      title: "Espace événementiel avec terrasse Toronto",
      description: "Venue unique de 300m² avec terrasse rooftop. Vue sur le lac Ontario. Capacité 150 personnes. Équipement complet pour mariages, galas ou événements corporate.",
      city: "Toronto",
      province: "ON" as const,
      price: 650,
      maxGuests: 150,
      lat: 43.6426,
      lng: -79.3871,
    },
  },
  // RECORDING_STUDIO
  {
    type: "RECORDING_STUDIO" as const,
    france: {
      title: "Studio d'enregistrement professionnel Lille",
      description: "Studio d'enregistrement haut de gamme avec cabine isolée. Console Neve, micros Neumann, monitoring Genelec. Ingénieur du son disponible sur demande. Idéal pour albums, podcasts, voix-off.",
      city: "Lille",
      regionFR: "HDF",
      price: 120,
      maxGuests: 6,
      lat: 50.6292,
      lng: 3.0573,
    },
    canada: {
      title: "Studio podcast et musique Montréal",
      description: "Studio polyvalent de 50m² équipé pour podcast et musique. Acoustique professionnelle, équipement moderne. Possibilité de streaming live. Quartier Mile-End créatif.",
      city: "Montréal",
      province: "QC" as const,
      price: 95,
      maxGuests: 4,
      lat: 45.5260,
      lng: -73.6001,
    },
  },
  // OTHER
  {
    type: "OTHER" as const,
    france: {
      title: "Atelier de poterie Strasbourg",
      description: "Atelier équipé pour poterie et céramique. Tours de potier, four à céramique, émaux. Cours disponibles ou location libre. Ambiance créative dans le quartier de la Petite France.",
      city: "Strasbourg",
      regionFR: "GES",
      price: 55,
      maxGuests: 6,
      lat: 48.5734,
      lng: 7.7521,
    },
    canada: {
      title: "Serre urbaine pour événements Halifax",
      description: "Magnifique serre victorienne transformée en espace événementiel. Plantes tropicales, lumière naturelle abondante. Parfait pour mariages intimes, shootings ou ateliers bien-être.",
      city: "Halifax",
      province: "NS" as const,
      price: 180,
      maxGuests: 30,
      lat: 44.6488,
      lng: -63.5752,
    },
  },
];

async function main() {
  console.log("🗑️  Suppression des annonces existantes...");

  // Supprimer toutes les images d'annonces
  await prisma.listingImage.deleteMany();
  console.log("  ✓ Images supprimées");

  // Supprimer toutes les annonces
  await prisma.listing.deleteMany();
  console.log("  ✓ Annonces supprimées");

  // Trouver ou créer un utilisateur hôte
  console.log("\n👤 Recherche d'un utilisateur hôte...");

  let hostUser = await prisma.user.findFirst({
    where: {
      OR: [
        { role: "HOST" },
        { role: "BOTH" },
        { role: "ADMIN" },
      ],
    },
  });

  if (!hostUser) {
    console.log("  Création d'un utilisateur hôte de test...");
    hostUser = await prisma.user.create({
      data: {
        email: "host@lokroom.test",
        name: "Hôte Test Lokroom",
        role: "HOST",
        identityStatus: "VERIFIED",
      },
    });
  }

  console.log(`  ✓ Utilisateur hôte: ${hostUser.email}`);

  console.log("\n🏠 Création des annonces...");

  let listingCount = 0;
  let imageCount = 0;

  for (const category of LISTINGS_DATA) {
    const type = category.type;
    const images = IMAGES[type] || IMAGES.OTHER;

    // Annonce France
    const franceListing = await prisma.listing.create({
      data: {
        title: category.france.title,
        description: category.france.description,
        type: type,
        price: category.france.price,
        currency: "EUR",
        pricingMode: "DAILY",
        country: "France",
        city: category.france.city,
        regionFR: category.france.regionFR,
        addressFull: `${category.france.city}, France`,
        lat: category.france.lat,
        lng: category.france.lng,
        latPublic: Math.round(category.france.lat * 100) / 100,
        lngPublic: Math.round(category.france.lng * 100) / 100,
        maxGuests: category.france.maxGuests || 2,
        beds: category.france.beds || null,
        bathrooms: category.france.bathrooms || null,
        desks: category.france.desks || null,
        parkings: category.france.parkings || null,
        isInstantBook: Math.random() > 0.5,
        spaceFeatures: ["well-located", "bright", "modern"].slice(0, Math.floor(Math.random() * 3) + 1),
        ownerId: hostUser.id,
      },
    });
    listingCount++;

    // Ajouter les images France
    for (let i = 0; i < images.length; i++) {
      await prisma.listingImage.create({
        data: {
          url: images[i],
          listingId: franceListing.id,
          isCover: i === 0,
          position: i,
        },
      });
      imageCount++;
    }

    console.log(`  ✓ ${type} (France): ${category.france.title.substring(0, 40)}...`);

    // Annonce Canada
    const canadaListing = await prisma.listing.create({
      data: {
        title: category.canada.title,
        description: category.canada.description,
        type: type,
        price: category.canada.price,
        currency: "CAD",
        pricingMode: "DAILY",
        country: "Canada",
        city: category.canada.city,
        province: category.canada.province,
        addressFull: `${category.canada.city}, Canada`,
        lat: category.canada.lat,
        lng: category.canada.lng,
        latPublic: Math.round(category.canada.lat * 100) / 100,
        lngPublic: Math.round(category.canada.lng * 100) / 100,
        maxGuests: category.canada.maxGuests || 2,
        beds: category.canada.beds || null,
        bathrooms: category.canada.bathrooms || null,
        desks: category.canada.desks || null,
        parkings: category.canada.parkings || null,
        isInstantBook: Math.random() > 0.5,
        spaceFeatures: ["unique", "spacious", "quiet"].slice(0, Math.floor(Math.random() * 3) + 1),
        ownerId: hostUser.id,
      },
    });
    listingCount++;

    // Ajouter les images Canada (mêmes images, ordre différent)
    const shuffledImages = [...images].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffledImages.length; i++) {
      await prisma.listingImage.create({
        data: {
          url: shuffledImages[i],
          listingId: canadaListing.id,
          isCover: i === 0,
          position: i,
        },
      });
      imageCount++;
    }

    console.log(`  ✓ ${type} (Canada): ${category.canada.title.substring(0, 40)}...`);
  }

  console.log(`\n✅ Seed terminé !`);
  console.log(`   - ${listingCount} annonces créées`);
  console.log(`   - ${imageCount} images ajoutées`);
  console.log(`   - ${LISTINGS_DATA.length} catégories couvertes`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
