import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Images libres de droit UNIQUES par annonce (Unsplash/Pexels)
// Chaque set d'images est utilisé une seule fois

const LISTINGS = [
  // ============ APARTMENT (4 annonces professionnelles) ============
  {
    type: "APARTMENT" as const,
    title: "Appartement haussmannien lumineux - Champs-Élysées",
    description: "Magnifique appartement de 85m² au cœur du 8ème arrondissement parisien. Immeuble haussmannien de standing avec parquet en point de Hongrie d'origine, moulures au plafond et cheminées en marbre. Deux chambres spacieuses et lumineuses, salon traversant avec balcon filant donnant sur une rue calme. Cuisine entièrement équipée avec électroménager moderne. Salle de bain avec baignoire et douche. Idéal pour familles ou professionnels. Métro George V à 5 minutes à pied.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 195,
    currency: "EUR" as const,
    maxGuests: 4,
    beds: 2,
    bathrooms: 1,
    lat: 48.8744,
    lng: 2.3064,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800",
      "https://images.unsplash.com/photo-1560185008-b033106af5c3?w=800",
      "https://images.unsplash.com/photo-1560185009-5bf9f2849488?w=800",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800",
    ],
  },
  {
    type: "APARTMENT" as const,
    title: "Loft design avec terrasse - Vieux-Lyon UNESCO",
    description: "Superbe loft de caractère de 110m² situé dans le quartier historique du Vieux-Lyon, classé au patrimoine mondial de l'UNESCO. Architecture unique avec poutres apparentes d'époque et grandes baies vitrées offrant une luminosité exceptionnelle. Décoration contemporaine soignée. Grand espace de vie ouvert avec cuisine américaine équipée d'appareils haut de gamme (four, plaque induction, lave-vaisselle). Terrasse privée de 20m² avec vue imprenable sur la basilique de Fourvière. Chambre avec lit king-size. Parfait pour couples, voyageurs d'affaires ou séjours culturels. Parking privé disponible.",
    city: "Lyon",
    country: "France",
    regionFR: "ARA",
    price: 145,
    currency: "EUR" as const,
    maxGuests: 3,
    beds: 1,
    bathrooms: 1,
    lat: 45.7640,
    lng: 4.8270,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800",
      "https://images.unsplash.com/photo-1484154218962-a197022b25ba?w=800",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800",
    ],
  },
  {
    type: "APARTMENT" as const,
    title: "Condo luxueux vue Vieux-Port - Centre-ville Montréal",
    description: "Somptueux condo de 90m² offrant une vue panoramique spectaculaire sur le Vieux-Port de Montréal et le fleuve Saint-Laurent. Design contemporain avec finitions haut de gamme : planchers de bois franc, comptoirs de quartz, luminaires design. Deux chambres spacieuses avec grands placards, deux salles de bain complètes (une avec bain thérapeutique). Cuisine moderne entièrement équipée avec îlot central. Grand balcon privé. L'immeuble dispose d'un gym ultramoderne, d'une piscine intérieure chauffée et d'un concierge 24/7. Stationnement intérieur inclus. À 5 minutes à pied du Vieux-Montréal, des restaurants, boutiques et du métro Place-d'Armes.",
    city: "Montréal",
    country: "Canada",
    province: "QC" as const,
    price: 175,
    currency: "CAD" as const,
    maxGuests: 4,
    beds: 2,
    bathrooms: 2,
    lat: 45.5048,
    lng: -73.5538,
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    ],
  },
  {
    type: "APARTMENT" as const,
    title: "Penthouse de luxe vue 360° - Downtown Toronto",
    description: "Penthouse d'exception de 120m² situé au 25ème étage d'une tour prestigieuse du centre-ville de Toronto. Vue panoramique à 360° absolument époustouflante sur la skyline de Toronto, la CN Tower et le lac Ontario. Trois chambres luxueuses avec literie haut de gamme, salon double hauteur avec plafond cathédrale, cuisine de chef entièrement équipée (appareils Sub-Zero et Wolf). Immense terrasse privée de 40m² avec mobilier de jardin et BBQ au gaz. Deux salles de bain complètes en marbre. Service de concierge 24/7, salle de sport privée, piscine sur le toit. Deux places de stationnement souterrain incluses. Le summum du luxe urbain pour une expérience inoubliable.",
    city: "Toronto",
    country: "Canada",
    province: "ON" as const,
    price: 350,
    currency: "CAD" as const,
    maxGuests: 6,
    beds: 3,
    bathrooms: 2,
    lat: 43.6426,
    lng: -79.3871,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
    ],
  },

  // ============ HOUSE (4 annonces professionnelles) ============
  {
    type: "HOUSE" as const,
    title: "Mas provençal authentique piscine chauffée - Luberon",
    description: "Magnifique mas provençal authentique de 180m² entièrement rénové, niché sur un terrain paysager de 2000m² planté d'oliviers centenaires et de lavandes. Piscine chauffée 12x6m avec pool house équipé (douche, WC, réfrigérateur). Quatre chambres spacieuses climatisées avec literie premium, trois salles de bain modernes. Grand salon avec cheminée en pierre, cuisine provençale équipée et cuisine d'été couverte avec plancha et four à pizza. Terrasses ombragées avec vue panoramique dégagée sur le Luberon et les villages perchés. Calme absolu, idéal pour se ressourcer en famille ou entre amis. Wifi fibre, parking privé pour 3 voitures. À 5 minutes du village de Gordes.",
    city: "Gordes",
    country: "France",
    regionFR: "PAC",
    price: 320,
    currency: "EUR" as const,
    maxGuests: 8,
    beds: 4,
    bathrooms: 3,
    lat: 43.9116,
    lng: 5.2005,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800",
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800",
    ],
  },
  {
    type: "HOUSE" as const,
    title: "Maison de pêcheur rénovée vue mer - Saint-Malo intra-muros",
    description: "Charmante maison de pêcheur du 18ème siècle entièrement rénovée avec goût, située dans les remparts de Saint-Malo intra-muros. Trois chambres confortables avec vue sur la mer, salon lumineux avec cheminée en pierre et poutres apparentes, salle à manger avec grande table en bois massif. Cuisine moderne entièrement équipée. Jardin clos de 50m² avec salon de jardin et barbecue. Accès direct à la plage de Bon-Secours à 100 mètres. Décoration marine raffinée mêlant authenticité bretonne et confort moderne. Parfait pour découvrir la Bretagne, ses plages, ses îles et sa gastronomie. Wifi, parking public à proximité.",
    city: "Saint-Malo",
    country: "France",
    regionFR: "BRE",
    price: 185,
    currency: "EUR" as const,
    maxGuests: 6,
    beds: 3,
    bathrooms: 2,
    lat: 48.6493,
    lng: -1.9890,
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
      "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800",
      "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800",
    ],
  },
  {
    type: "HOUSE" as const,
    title: "Chalet luxe ski-in/ski-out spa - Mont-Tremblant",
    description: "Magnifique chalet en bois rond de 200m² situé directement au pied des pistes de ski du Mont-Tremblant. Accès ski-in/ski-out exceptionnel. Cinq chambres spacieuses avec literie haut de gamme, trois salles de bain complètes. Grand salon cathédrale avec immense foyer au bois et mur de fenêtres offrant une vue spectaculaire sur les montagnes laurentiennes. Cuisine gastronomique entièrement équipée avec îlot central. Salle de jeux avec table de billard et baby-foot. Spa extérieur 6 places sur terrasse privée, sauna finlandais. Garage chauffé double. L'hiver canadien dans tout son charme et son confort. Parfait pour familles ou groupes d'amis skieurs.",
    city: "Mont-Tremblant",
    country: "Canada",
    province: "QC" as const,
    price: 450,
    currency: "CAD" as const,
    maxGuests: 10,
    beds: 5,
    bathrooms: 3,
    lat: 46.1185,
    lng: -74.5962,
    images: [
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800",
      "https://images.unsplash.com/photo-1520984032042-162d526883e0?w=800",
      "https://images.unsplash.com/photo-1601919051950-bb9f3ffb3fee?w=800",
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800",
      "https://images.unsplash.com/photo-1595877244574-e90ce41ce9d9?w=800",
      "https://images.unsplash.com/photo-1584752242818-b4bd7fb3fe10?w=800",
    ],
  },
  {
    type: "HOUSE" as const,
    title: "Villa architecturale moderne vue océan - West Vancouver",
    description: "Villa d'architecte exceptionnelle de 300m² avec vue panoramique époustouflante sur l'océan Pacifique et les montagnes de North Shore. Design minimaliste contemporain avec matériaux nobles : béton ciré, bois de cèdre, verre et acier. Quatre suites parentales avec salles de bain privatives en marbre. Immense espace de vie ouvert avec plafond de 6 mètres, cuisine de chef avec appareils Miele et Sub-Zero. Infinity pool chauffée donnant l'impression de plonger dans l'océan. Multiples terrasses avec mobilier design. Système domotique intégral (éclairage, chauffage, son). Garage triple avec borne de recharge Tesla. Intimité totale dans un quartier résidentiel prestigieux. Pour une expérience de luxe inoubliable.",
    city: "Vancouver",
    country: "Canada",
    province: "BC" as const,
    price: 550,
    currency: "CAD" as const,
    maxGuests: 8,
    beds: 4,
    bathrooms: 4,
    lat: 49.3270,
    lng: -123.1650,
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
      "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800",
      "https://images.unsplash.com/photo-1600563438938-a9a27215b715?w=800",
    ],
  },

  // ============ ROOM (3 annonces professionnelles) ============
  {
    type: "ROOM" as const,
    title: "Chambre bohème chic chez artiste - Montmartre",
    description: "Chambre privée de 16m² dans un appartement d'artiste authentique situé au cœur du quartier historique de Montmartre. Décoration bohème soignée avec objets chinés et œuvres d'art originales. Lit double confortable avec linge de maison de qualité, bureau vintage en bois massif, fauteuil de lecture. Grande fenêtre avec vue charmante sur les toits de Paris et le Sacré-Cœur. Salle de bain partagée propre et bien entretenue. Petit-déjeuner français inclus (croissants, pain frais, confiture maison, café). Votre hôte est un artiste peintre passionné qui pourra vous conseiller sur les meilleurs endroits du quartier. Ambiance conviviale et authentique. Métro Abbesses à 3 minutes.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 75,
    currency: "EUR" as const,
    maxGuests: 2,
    beds: 1,
    bathrooms: 1,
    lat: 48.8867,
    lng: 2.3431,
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
    ],
  },
  {
    type: "ROOM" as const,
    title: "Suite privée maison bourgeoise - Vignobles bordelais",
    description: "Grande chambre de 25m² avec salle de bain privative dans une élégante maison bourgeoise bordelaise du 19ème siècle. Mobilier ancien de caractère, parquet en chêne massif, linge de maison haut de gamme en lin. Lit queen-size très confortable. Salle de bain privée avec douche à l'italienne et produits de toilette bio. Accès libre au jardin paysager de 500m² et à la terrasse ombragée. Quartier résidentiel calme à 15 minutes du centre de Bordeaux et à proximité immédiate des vignobles prestigieux (Pessac-Léognan, Graves). Vos hôtes sont œnologues et pourront vous conseiller sur les meilleures visites de châteaux et dégustations. Petit-déjeuner gastronomique inclus. Parking privé.",
    city: "Bordeaux",
    country: "France",
    regionFR: "NAQ",
    price: 95,
    currency: "EUR" as const,
    maxGuests: 2,
    beds: 1,
    bathrooms: 1,
    lat: 44.8378,
    lng: -0.5792,
    images: [
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
      "https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?w=800",
    ],
  },
  {
    type: "ROOM" as const,
    title: "Chambre zen design - Plateau Mont-Royal Montréal",
    description: "Chambre paisible et lumineuse dans un appartement moderne du vibrant quartier du Plateau Mont-Royal. Ambiance zen soigneusement créée avec décoration minimaliste, nombreuses plantes vertes purifiantes et matériaux naturels. Lit queen-size avec matelas mémoire de forme haut de gamme et literie hypoallergénique. Bureau ergonomique avec chaise confortable, parfait pour le télétravail. Salle de bain partagée impeccablement propre avec douche à effet pluie. Cuisine commune entièrement équipée accessible. Le quartier regorge de cafés branchés, restaurants internationaux, boutiques vintage et galeries d'art. Métro Mont-Royal à 5 minutes. Votre hôte est un voyageur passionné qui parle français, anglais et espagnol. Wifi fibre ultra-rapide.",
    city: "Montréal",
    country: "Canada",
    province: "QC" as const,
    price: 65,
    currency: "CAD" as const,
    maxGuests: 2,
    beds: 1,
    bathrooms: 1,
    lat: 45.5225,
    lng: -73.5878,
    images: [
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
    ],
  },

  // ============ STUDIO (3 annonces professionnelles) ============
  {
    type: "STUDIO" as const,
    title: "Atelier d'artiste verrière nord - Quartier Bastille Paris",
    description: "Authentique atelier d'artiste de 60m² avec magnifique verrière orientée nord offrant une lumière naturelle exceptionnelle et constante toute la journée, idéale pour la création artistique. Plafond cathédrale de 4 mètres de hauteur. Espace entièrement modulable avec chevalet professionnel, tables de travail, matériel de base inclus (pinceaux, toiles, chevalets supplémentaires). Sol en béton ciré facile à nettoyer. Coin kitchenette et WC. Parfait pour peintres, photographes, créateurs de contenu, workshops créatifs ou shootings photo. Quartier Bastille dynamique avec nombreux cafés et restaurants. Métro Bastille à 5 minutes. Location à l'heure ou à la journée.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 110,
    currency: "EUR" as const,
    maxGuests: 4,
    lat: 48.8530,
    lng: 2.3699,
    images: [
      "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=800",
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1572883454114-1cf0031ede2a?w=800",
      "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800",
      "https://images.unsplash.com/photo-1580136579585-9a32c5ef6e97?w=800",
    ],
  },
  {
    type: "STUDIO" as const,
    title: "Studio photo professionnel équipé - Centre Marseille",
    description: "Studio photo professionnel de 80m² entièrement équipé situé dans le centre de Marseille. Cyclorama blanc permanent de 6x4m, fonds colorés interchangeables (noir, gris, vert). Éclairage professionnel complet : 4 flashs Profoto B10 Plus avec softboxes, parapluies et réflecteurs. Rails de suspension au plafond pour fonds et éclairages. Espace maquillage avec miroir éclairé et chaises confortables. Vestiaire privé pour les modèles. Cuisine équipée et WC. Wifi fibre, climatisation. Location à l'heure ou à la journée. Assistants photographes disponibles sur demande (supplément). Parking gratuit à proximité. Idéal pour shootings mode, portraits, produits, vidéos.",
    city: "Marseille",
    country: "France",
    regionFR: "PAC",
    price: 85,
    currency: "EUR" as const,
    maxGuests: 8,
    lat: 43.2965,
    lng: 5.3698,
    images: [
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800",
      "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=800",
      "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
    ],
  },
  {
    type: "STUDIO" as const,
    title: "Studio créatif polyvalent - Gastown historique Vancouver",
    description: "Espace créatif polyvalent de 70m² dans un bâtiment patrimonial du quartier historique de Gastown à Vancouver. Murs de briques apparentes authentiques, immenses fenêtres industrielles offrant une lumière naturelle abondante, plafonds hauts de 4 mètres avec poutres en bois. Espace modulable parfait pour ateliers créatifs, cours de yoga/pilates, séances photo, tournages vidéo, petits événements privés ou réunions d'équipe. Équipement de base fourni : tables pliantes, chaises empilables, système audio Bluetooth, projecteur HD. Cuisine équipée et salle de bain moderne. Wifi ultra-rapide. Quartier vibrant avec cafés artisanaux et restaurants. Stationnement public à 2 minutes.",
    city: "Vancouver",
    country: "Canada",
    province: "BC" as const,
    price: 120,
    currency: "CAD" as const,
    maxGuests: 12,
    lat: 49.2827,
    lng: -123.1094,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800",
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800",
    ],
  },

  // ============ OFFICE (3 annonces) ============
  {
    type: "OFFICE" as const,
    title: "Bureau standing La Défense",
    description: "Bureau fermé de 30m² dans tour de La Défense. Vue panoramique au 28ème étage. Mobilier design, internet fibre. Accès salles de réunion, rooftop, restaurant d'entreprise. Prestige et efficacité.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 120,
    currency: "EUR" as const,
    maxGuests: 4,
    desks: 4,
    lat: 48.8924,
    lng: 2.2360,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
      "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800",
      "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800",
      "https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=800",
    ],
  },
  {
    type: "OFFICE" as const,
    title: "Bureau privé centre Toulouse",
    description: "Espace de travail de 20m² dans immeuble rénové du centre de Toulouse. Lumineux, calme, climatisé. Internet haut débit, imprimante partagée. Proche métro et commerces. Idéal freelances et TPE.",
    city: "Toulouse",
    country: "France",
    regionFR: "OCC",
    price: 55,
    currency: "EUR" as const,
    maxGuests: 2,
    desks: 2,
    lat: 43.6047,
    lng: 1.4442,
    images: [
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800",
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800",
      "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800",
      "https://images.unsplash.com/photo-1585257479584-a2bc9c1d0645?w=800",
      "https://images.unsplash.com/photo-1560264280-88b68371db39?w=800",
    ],
  },
  {
    type: "OFFICE" as const,
    title: "Bureau vue CN Tower",
    description: "Bureau privatif de 25m² avec vue directe sur la CN Tower. Immeuble classe A du Financial District. Services premium inclus: réception, café, ménage quotidien. Pour professionnels exigeants.",
    city: "Toronto",
    country: "Canada",
    province: "ON" as const,
    price: 150,
    currency: "CAD" as const,
    maxGuests: 3,
    desks: 3,
    lat: 43.6510,
    lng: -79.3470,
    images: [
      "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800",
      "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800",
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800",
      "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800",
      "https://images.unsplash.com/photo-1560264357-8d9202250f21?w=800",
    ],
  },

  // ============ COWORKING (3 annonces) ============
  {
    type: "COWORKING" as const,
    title: "Coworking design République",
    description: "Poste de travail dans espace de coworking tendance près de République. Communauté de startups et créatifs. Café, thé, fruits frais inclus. Events networking chaque semaine. Ambiance startup friendly.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 28,
    currency: "EUR" as const,
    maxGuests: 1,
    desks: 1,
    lat: 48.8674,
    lng: 2.3639,
    images: [
      "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800",
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800",
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800",
    ],
  },
  {
    type: "COWORKING" as const,
    title: "Espace partagé Confluence",
    description: "Coworking dans le quartier innovant de Confluence à Lyon. Architecture moderne, terrasse, vue Saône. Communauté diversifiée: tech, design, conseil. Forfaits flexibles, accès 24/7.",
    city: "Lyon",
    country: "France",
    regionFR: "ARA",
    price: 22,
    currency: "EUR" as const,
    maxGuests: 1,
    desks: 1,
    lat: 45.7378,
    lng: 4.8188,
    images: [
      "https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800",
      "https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800",
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
    ],
  },
  {
    type: "COWORKING" as const,
    title: "Hub tech Downtown Vancouver",
    description: "Coworking tech au cœur de Vancouver. Équipé pour développeurs: dual screens, standing desks, salles focus. Communauté internationale, mentoring startup. Café de spécialité illimité.",
    city: "Vancouver",
    country: "Canada",
    province: "BC" as const,
    price: 40,
    currency: "CAD" as const,
    maxGuests: 1,
    desks: 1,
    lat: 49.2827,
    lng: -123.1207,
    images: [
      "https://images.unsplash.com/photo-1606857521015-7f9fcf423571?w=800",
      "https://images.unsplash.com/photo-1560264280-88b68371db39?w=800",
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800",
      "https://images.unsplash.com/photo-1552581234-26160f608093?w=800",
      "https://images.unsplash.com/photo-1557425529-b1ae9c141e7e?w=800",
    ],
  },

  // ============ MEETING_ROOM (3 annonces) ============
  {
    type: "MEETING_ROOM" as const,
    title: "Salle boardroom Opéra",
    description: "Salle de conseil de 12 places près de l'Opéra. Table en noyer, fauteuils cuir, équipement visio Poly. Service traiteur Lenôtre disponible. Discrétion et standing pour vos réunions importantes.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 95,
    currency: "EUR" as const,
    maxGuests: 12,
    lat: 48.8706,
    lng: 2.3319,
    images: [
      "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800",
      "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800",
      "https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800",
      "https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=800",
      "https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800",
    ],
  },
  {
    type: "MEETING_ROOM" as const,
    title: "Espace formation Nantes",
    description: "Salle modulable de 50m² pour formations jusqu'à 20 personnes. Vidéoprojecteur 4K, paperboard, wifi performant. Configuration théâtre ou workshop. Pause café/viennoiseries en option.",
    city: "Nantes",
    country: "France",
    regionFR: "PDL",
    price: 65,
    currency: "EUR" as const,
    maxGuests: 20,
    lat: 47.2184,
    lng: -1.5536,
    images: [
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800",
      "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800",
      "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800",
    ],
  },
  {
    type: "MEETING_ROOM" as const,
    title: "Salle panoramique Calgary",
    description: "Salle de réunion au 35ème étage avec vue Rocheuses. 16 places, écran 85 pouces, système Teams Rooms. Café gourmet et snacks inclus. Impressionnez vos clients et partenaires.",
    city: "Calgary",
    country: "Canada",
    province: "AB" as const,
    price: 110,
    currency: "CAD" as const,
    maxGuests: 16,
    lat: 51.0447,
    lng: -114.0719,
    images: [
      "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800",
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800",
    ],
  },

  // ============ PARKING (3 annonces) ============
  {
    type: "PARKING" as const,
    title: "Parking souterrain Marais",
    description: "Place de parking sécurisée en sous-sol dans le Marais. Accès badge 24/7, vidéosurveillance, gardien. Idéal pour résidents ou visiteurs réguliers. Proche BHV et Hôtel de Ville.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 18,
    currency: "EUR" as const,
    parkings: 1,
    lat: 48.8566,
    lng: 2.3522,
    images: [
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800",
      "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800",
      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800",
      "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=800",
      "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=800",
    ],
  },
  {
    type: "PARKING" as const,
    title: "Place couverte Nice Promenade",
    description: "Stationnement couvert à 2 min de la Promenade des Anglais. Résidence sécurisée, accès facile. Parfait pour vacanciers ou professionnels. Disponible courte et longue durée.",
    city: "Nice",
    country: "France",
    regionFR: "PAC",
    price: 14,
    currency: "EUR" as const,
    parkings: 1,
    lat: 43.6955,
    lng: 7.2654,
    images: [
      "https://images.unsplash.com/photo-1545179605-f9d782800adb?w=800",
      "https://images.unsplash.com/photo-1593280443091-60c8d6f57e80?w=800",
      "https://images.unsplash.com/photo-1596394723269-4a7e66c4ef39?w=800",
      "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800",
      "https://images.unsplash.com/photo-1604063165585-e79c3b8b4a61?w=800",
    ],
  },
  {
    type: "PARKING" as const,
    title: "Stationnement intérieur Toronto",
    description: "Place chauffée dans parking souterrain du Financial District. Accès direct au PATH. Idéal pour l'hiver. Bornes de recharge électrique disponibles moyennant supplément.",
    city: "Toronto",
    country: "Canada",
    province: "ON" as const,
    price: 25,
    currency: "CAD" as const,
    parkings: 1,
    lat: 43.6481,
    lng: -79.3858,
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800",
      "https://images.unsplash.com/photo-1612825173281-9a193378527e?w=800",
      "https://images.unsplash.com/photo-1611287486505-7cfcb0a2b5b1?w=800",
      "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?w=800",
    ],
  },

  // ============ GARAGE (3 annonces) ============
  {
    type: "GARAGE" as const,
    title: "Box fermé sécurisé Lyon",
    description: "Garage fermé de 18m² dans résidence gardiennée à Lyon 6ème. Électricité disponible, sol béton. Parfait pour voiture de collection, moto ou stockage. Accès 24/7.",
    city: "Lyon",
    country: "France",
    regionFR: "ARA",
    price: 28,
    currency: "EUR" as const,
    parkings: 1,
    lat: 45.7676,
    lng: 4.8503,
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=800",
      "https://images.unsplash.com/photo-1597766659675-92ae7a445988?w=800",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
    ],
  },
  {
    type: "GARAGE" as const,
    title: "Garage atelier Bordeaux",
    description: "Grand garage de 25m² aménageable en atelier. Portail motorisé, éclairage LED, prises 220V/380V. Quartier Bacalan en plein renouveau. Idéal bricoleurs ou artisans.",
    city: "Bordeaux",
    country: "France",
    regionFR: "NAQ",
    price: 35,
    currency: "EUR" as const,
    parkings: 1,
    lat: 44.8631,
    lng: -0.5548,
    images: [
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1625773595773-c8a116c7d56a?w=800",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    ],
  },
  {
    type: "GARAGE" as const,
    title: "Garage chauffé double Edmonton",
    description: "Garage double de 45m² entièrement chauffé et isolé. Indispensable pour les hivers à -30°C! Espace pour 2 véhicules ou atelier. Résidentiel calme, accès facile.",
    city: "Edmonton",
    country: "Canada",
    province: "AB" as const,
    price: 55,
    currency: "CAD" as const,
    parkings: 2,
    lat: 53.5461,
    lng: -113.4938,
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800",
    ],
  },

  // ============ STORAGE (3 annonces) ============
  {
    type: "STORAGE" as const,
    title: "Box stockage climatisé Paris",
    description: "Espace de stockage de 12m² avec contrôle température et humidité. Idéal pour meubles, archives, œuvres d'art. Surveillance 24/7, accès badge. Assurance incluse.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 120,
    currency: "EUR" as const,
    maxGuests: 1,
    lat: 48.8380,
    lng: 2.3262,
    images: [
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    ],
  },
  {
    type: "STORAGE" as const,
    title: "Garde-meuble accessible Lille",
    description: "Unité de stockage de 20m² au rez-de-chaussée pour accès facile. Quai de déchargement, chariots disponibles. Contrat flexible sans engagement. Tarif dégressif longue durée.",
    city: "Lille",
    country: "France",
    regionFR: "HDF",
    price: 95,
    currency: "EUR" as const,
    maxGuests: 1,
    lat: 50.6292,
    lng: 3.0573,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
    ],
  },
  {
    type: "STORAGE" as const,
    title: "Mini-entrepôt sécurisé Montréal",
    description: "Espace d'entreposage de 15m² dans complexe sécurisé. Accès 7j/7 de 6h à 22h. Alarme individuelle, sprinklers. Parfait pour e-commerce ou déménagement temporaire.",
    city: "Montréal",
    country: "Canada",
    province: "QC" as const,
    price: 110,
    currency: "CAD" as const,
    maxGuests: 1,
    lat: 45.5088,
    lng: -73.5878,
    images: [
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    ],
  },

  // ============ EVENT_SPACE (3 annonces) ============
  {
    type: "EVENT_SPACE" as const,
    title: "Loft industriel événementiel",
    description: "Loft brut de 250m² dans ancienne usine réhabilitée. Hauteur 5m, poutres métalliques, murs briques. Capacité 150 debout. Cuisine traiteur, sono, éclairages programmables. Pour événements uniques.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 550,
    currency: "EUR" as const,
    maxGuests: 150,
    lat: 48.8844,
    lng: 2.3476,
    images: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800",
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800",
      "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    ],
  },
  {
    type: "EVENT_SPACE" as const,
    title: "Château événementiel Loire",
    description: "Orangerie et jardins d'un château du XVIIIème siècle. Capacité 200 personnes assises. Cadre exceptionnel pour mariages, séminaires, galas. Hébergement sur place possible.",
    city: "Tours",
    country: "France",
    regionFR: "CVL",
    price: 1200,
    currency: "EUR" as const,
    maxGuests: 200,
    lat: 47.3941,
    lng: 0.6848,
    images: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800",
      "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?w=800",
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=800",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800",
    ],
  },
  {
    type: "EVENT_SPACE" as const,
    title: "Rooftop vue skyline Toronto",
    description: "Terrasse rooftop de 400m² avec vue époustouflante sur Toronto. Bar intégré, piste de danse, lounge. Capacité 200 cocktail. Chauffage extérieur pour soirées fraîches.",
    city: "Toronto",
    country: "Canada",
    province: "ON" as const,
    price: 850,
    currency: "CAD" as const,
    maxGuests: 200,
    lat: 43.6454,
    lng: -79.3806,
    images: [
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
      "https://images.unsplash.com/photo-1496024840928-4c417adf211d?w=800",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
      "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=800",
    ],
  },

  // ============ RECORDING_STUDIO (3 annonces) ============
  {
    type: "RECORDING_STUDIO" as const,
    title: "Studio SSL professionnel",
    description: "Studio d'enregistrement haut de gamme avec console SSL 4000. Cabine vocale traitée, micros vintage (U87, C12). Monitoring Genelec. Ingénieur du son expérimenté disponible. Pour productions exigeantes.",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 180,
    currency: "EUR" as const,
    maxGuests: 6,
    lat: 48.8619,
    lng: 2.3519,
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
      "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800",
      "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800",
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800",
      "https://images.unsplash.com/photo-1558618047-f4b511b67309?w=800",
    ],
  },
  {
    type: "RECORDING_STUDIO" as const,
    title: "Home studio podcast Marseille",
    description: "Studio intimiste parfait pour podcasts et voix-off. Traitement acoustique professionnel, micros Shure SM7B. Mixage et mastering inclus. Ambiance décontractée, parking facile.",
    city: "Marseille",
    country: "France",
    regionFR: "PAC",
    price: 65,
    currency: "EUR" as const,
    maxGuests: 4,
    lat: 43.2965,
    lng: 5.3698,
    images: [
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800",
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
      "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
    ],
  },
  {
    type: "RECORDING_STUDIO" as const,
    title: "Studio musique Mile-End",
    description: "Studio de production musicale dans le quartier créatif de Mile-End. Console Neve, synthés vintage, batteries acoustiques. Live room pour groupes jusqu'à 5 musiciens. Vibe artistique unique.",
    city: "Montréal",
    country: "Canada",
    province: "QC" as const,
    price: 120,
    currency: "CAD" as const,
    maxGuests: 8,
    lat: 45.5260,
    lng: -73.6001,
    images: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
      "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800",
    ],
  },

  // ============ OTHER (4 annonces) ============
  {
    type: "OTHER" as const,
    title: "Atelier céramique équipé",
    description: "Atelier de poterie de 40m² entièrement équipé. 4 tours de potier, four haute température, émaux. Cours ou location libre. Quartier artisanal de Montreuil. Créativité bienvenue!",
    city: "Paris",
    country: "France",
    regionFR: "IDF",
    price: 45,
    currency: "EUR" as const,
    maxGuests: 6,
    lat: 48.8638,
    lng: 2.4419,
    images: [
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800",
      "https://images.unsplash.com/photo-1609619385002-f40f1df9b5a4?w=800",
      "https://images.unsplash.com/photo-1564429238980-c7073aba7f91?w=800",
    ],
  },
  {
    type: "OTHER" as const,
    title: "Cuisine professionnelle partagée",
    description: "Cuisine commerciale de 60m² aux normes HACCP. Équipement pro: piano, chambre froide, pétrin. Location à l'heure pour traiteurs, food entrepreneurs. Accompagnement possible.",
    city: "Lyon",
    country: "France",
    regionFR: "ARA",
    price: 55,
    currency: "EUR" as const,
    maxGuests: 4,
    lat: 45.7640,
    lng: 4.8357,
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800",
      "https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=800",
      "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800",
      "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800",
    ],
  },
  {
    type: "OTHER" as const,
    title: "Serre tropicale événementielle",
    description: "Magnifique serre victorienne de 150m² remplie de plantes exotiques. Ambiance jungle urbaine unique. Parfait pour shootings, mariages intimistes, ateliers bien-être. Éclairage naturel exceptionnel.",
    city: "Montréal",
    country: "Canada",
    province: "QC" as const,
    price: 200,
    currency: "CAD" as const,
    maxGuests: 40,
    lat: 45.5088,
    lng: -73.5617,
    images: [
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800",
      "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800",
      "https://images.unsplash.com/photo-1518882605630-8eb607e62837?w=800",
    ],
  },
  {
    type: "OTHER" as const,
    title: "Terrain de basketball privé",
    description: "Terrain de basket indoor de 400m² avec parquet professionnel. Vestiaires, douches, gradins 50 places. Location pour matchs, entraînements, tournois. Arbitres disponibles sur demande.",
    city: "Toronto",
    country: "Canada",
    province: "ON" as const,
    price: 150,
    currency: "CAD" as const,
    maxGuests: 30,
    lat: 43.6629,
    lng: -79.3957,
    images: [
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
      "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800",
      "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800",
    ],
  },
];

// Amenities de base par catégorie
const AMENITIES = [
  // GENERAL
  { slug: "wifi", label: "WiFi", category: "GENERAL" },
  { slug: "air-conditioning", label: "Climatisation", category: "GENERAL" },
  { slug: "heating", label: "Chauffage", category: "GENERAL" },
  { slug: "tv", label: "Télévision", category: "GENERAL" },
  { slug: "workspace", label: "Espace de travail", category: "GENERAL" },
  { slug: "kitchen", label: "Cuisine", category: "GENERAL" },
  { slug: "washer", label: "Lave-linge", category: "GENERAL" },
  { slug: "dryer", label: "Sèche-linge", category: "GENERAL" },
  { slug: "iron", label: "Fer à repasser", category: "GENERAL" },
  { slug: "hair-dryer", label: "Sèche-cheveux", category: "GENERAL" },
  { slug: "essentials", label: "Essentiels (serviettes, draps, savon)", category: "GENERAL" },
  { slug: "hangers", label: "Cintres", category: "GENERAL" },

  // BUSINESS
  { slug: "printer", label: "Imprimante", category: "BUSINESS" },
  { slug: "projector", label: "Vidéoprojecteur", category: "BUSINESS" },
  { slug: "whiteboard", label: "Tableau blanc", category: "BUSINESS" },
  { slug: "conference-phone", label: "Téléphone de conférence", category: "BUSINESS" },
  { slug: "high-speed-internet", label: "Internet haut débit", category: "BUSINESS" },
  { slug: "meeting-room", label: "Salle de réunion", category: "BUSINESS" },

  // PARKING
  { slug: "free-parking", label: "Parking gratuit", category: "PARKING" },
  { slug: "paid-parking", label: "Parking payant", category: "PARKING" },
  { slug: "ev-charger", label: "Borne de recharge électrique", category: "PARKING" },
  { slug: "garage", label: "Garage", category: "PARKING" },

  // ACCESSIBILITY
  { slug: "elevator", label: "Ascenseur", category: "ACCESSIBILITY" },
  { slug: "wheelchair-accessible", label: "Accessible en fauteuil roulant", category: "ACCESSIBILITY" },
  { slug: "ground-floor", label: "Rez-de-chaussée", category: "ACCESSIBILITY" },

  // OUTDOOR
  { slug: "pool", label: "Piscine", category: "OUTDOOR" },
  { slug: "hot-tub", label: "Jacuzzi", category: "OUTDOOR" },
  { slug: "garden", label: "Jardin", category: "OUTDOOR" },
  { slug: "balcony", label: "Balcon", category: "OUTDOOR" },
  { slug: "terrace", label: "Terrasse", category: "OUTDOOR" },
  { slug: "bbq", label: "Barbecue", category: "OUTDOOR" },

  // MEDIA
  { slug: "sound-system", label: "Système audio", category: "MEDIA" },
  { slug: "recording-equipment", label: "Équipement d'enregistrement", category: "MEDIA" },
  { slug: "lighting-equipment", label: "Équipement d'éclairage", category: "MEDIA" },
  { slug: "green-screen", label: "Fond vert", category: "MEDIA" },
  { slug: "soundproofing", label: "Isolation phonique", category: "MEDIA" },
];

async function main() {
  console.log("🗑️  Suppression des données existantes...");

  // Supprimer toutes les images d'annonces
  await prisma.listingImage.deleteMany();
  console.log("  ✓ Images supprimées");

  // Supprimer les relations amenities
  await prisma.listingAmenity.deleteMany();
  console.log("  ✓ Relations amenities supprimées");

  // Supprimer toutes les annonces
  await prisma.listing.deleteMany();
  console.log("  ✓ Annonces supprimées");

  // Supprimer les amenities existantes
  await prisma.amenity.deleteMany();
  console.log("  ✓ Amenities supprimées");

  // Créer les amenities
  console.log("\n🏷️  Création des amenities...");
  const createdAmenities = [];
  for (const amenity of AMENITIES) {
    const created = await prisma.amenity.create({
      data: {
        slug: amenity.slug,
        label: amenity.label,
        category: amenity.category as any,
      },
    });
    createdAmenities.push(created);
  }
  console.log(`  ✓ ${createdAmenities.length} amenities créées`);

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

  console.log("\n🏠 Création des 40 annonces...\n");

  let listingCount = 0;
  let imageCount = 0;

  const spaceFeatures = ["well-located", "unique", "spacious", "quiet", "bright", "modern", "charming", "cozy", "professional", "equipped", "secure", "accessible"];

  for (const listing of LISTINGS) {
    const createdListing = await prisma.listing.create({
      data: {
        title: listing.title,
        description: listing.description,
        type: listing.type,
        price: listing.price,
        currency: listing.currency,
        pricingMode: "DAILY",
        country: listing.country,
        city: listing.city,
        regionFR: listing.regionFR || null,
        province: listing.province || null,
        addressFull: `${listing.city}, ${listing.country}`,
        lat: listing.lat,
        lng: listing.lng,
        latPublic: Math.round(listing.lat * 100) / 100,
        lngPublic: Math.round(listing.lng * 100) / 100,
        maxGuests: listing.maxGuests || 2,
        beds: listing.beds || null,
        bathrooms: listing.bathrooms || null,
        desks: listing.desks || null,
        parkings: listing.parkings || null,
        isInstantBook: Math.random() > 0.5,
        spaceFeatures: spaceFeatures.slice(0, Math.floor(Math.random() * 4) + 2),
        ownerId: hostUser.id,
      },
    });
    listingCount++;

    // Ajouter les images
    for (let i = 0; i < listing.images.length; i++) {
      await prisma.listingImage.create({
        data: {
          url: listing.images[i],
          listingId: createdListing.id,
          isCover: i === 0,
          position: i,
        },
      });
      imageCount++;
    }

    console.log(`  ✓ ${listing.type.padEnd(16)} | ${listing.country.padEnd(6)} | ${listing.city.padEnd(15)} | ${listing.title.substring(0, 35)}...`);
  }

  console.log(`\n✅ Seed terminé !`);
  console.log(`   - ${listingCount} annonces créées`);
  console.log(`   - ${imageCount} images ajoutées`);

  // Stats par pays
  const franceCount = LISTINGS.filter(l => l.country === "France").length;
  const canadaCount = LISTINGS.filter(l => l.country === "Canada").length;
  console.log(`   - ${franceCount} annonces en France`);
  console.log(`   - ${canadaCount} annonces au Canada`);

  // Stats par type
  const types = [...new Set(LISTINGS.map(l => l.type))];
  console.log(`   - ${types.length} catégories couvertes`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
