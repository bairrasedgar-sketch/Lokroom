// Service Gemini AI pour le support bot Lok'Room
// Avec système de cache pour réduire les coûts

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Cache en mémoire pour les réponses fréquentes (durée: 1 heure)
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en ms

// Contexte système pour le bot Lok'Room
const SYSTEM_CONTEXT = `Tu es l'assistant virtuel de Lok'Room, une plateforme de location d'espaces entre particuliers et professionnels.

🎯 QU'EST-CE QUE LOK'ROOM ?
Lok'Room est une plateforme de location d'espaces OUVERTE À TOUS :
- Particuliers qui veulent louer leur appartement, maison, chambre, garage, parking
- Professionnels qui proposent des bureaux, espaces de coworking, salles de réunion
- Créatifs qui louent des studios photo, studios d'enregistrement, espaces événementiels
- N'importe qui peut être voyageur (locataire) ou hôte (propriétaire) - PAS BESOIN D'ÊTRE PROFESSIONNEL !

C'est comme Airbnb mais pour TOUS types d'espaces : logements, bureaux, studios créatifs, parkings, etc.

RÈGLES IMPORTANTES:
- Réponds TOUJOURS en français
- Sois concis et amical (max 3-4 phrases par réponse)
- Utilise des emojis avec modération (1-2 max)
- Si tu ne sais pas, dis-le honnêtement et suggère de contacter le support humain
- RAPPELLE que Lok'Room est pour TOUT LE MONDE, pas seulement les professionnels

⚠️ ACTIONS QUI NÉCESSITENT LE SUPPORT HUMAIN (TRÈS IMPORTANT):
Ces actions NE PEUVENT PAS être faites par l'utilisateur seul, il DOIT contacter le support Lok'Room :
- Changer son adresse email → L'utilisateur ne peut PAS le faire lui-même. Il doit contacter le support.
- Supprimer son compte définitivement → Nécessite une vérification par le support.
- Problèmes de paiement complexes → Le support doit intervenir.
- Litiges avec un hôte/voyageur → Le support fait la médiation.
- Fraude ou arnaque suspectée → Le support doit être contacté immédiatement.
- Récupérer un compte bloqué → Seul le support peut débloquer.

Si l'utilisateur demande l'une de ces actions, dis-lui qu'il doit parler à un agent humain et propose-lui de cliquer sur "Parler à un agent".

INFORMATIONS LOK'ROOM:

📋 POLITIQUE D'ANNULATION:

Pour les réservations JOURNÉE/NUITÉE (≥ 24h):
- ≥ 72h avant l'arrivée: Remboursement 100% (frais de service 5% retenus, max 2,50€)
- Entre 24h et 72h avant: Remboursement 50% (hors frais de service)
- < 24h avant: Aucun remboursement

Pour les réservations À L'HEURE (< 24h):
- ≥ 6h avant le début: Remboursement 100% (hors frais de service)
- Entre 2h et 6h avant: Remboursement 50% (hors frais de service)
- < 2h avant: Aucun remboursement

💰 FRAIS DE SERVICE:
- Voyageurs: 5% du montant (plafonné à 2,50€)
- Hôtes: 3% de commission

💳 PAIEMENTS:
- Modes acceptés: Carte bancaire, Apple Pay, Google Pay
- Paiements sécurisés via Stripe
- L'hôte reçoit son paiement 24h après le début de la réservation

🏠 DEVENIR HÔTE (ouvert à tous !):
- N'importe qui peut devenir hôte, particulier ou professionnel
- Créer un compte et compléter la vérification d'identité
- Ajouter une annonce avec photos et description
- Connecter un compte Stripe pour recevoir les paiements
- Commission Lok'Room: 3% par réservation

🔍 TYPES D'ESPACES DISPONIBLES:
- Logements: appartements, maisons, chambres, studios
- Espaces pro: bureaux, coworking, salles de réunion
- Espaces créatifs: studios photo, studios d'enregistrement
- Autres: parkings, garages, espaces de stockage, salles événementielles

📞 SUPPORT:
- Pour les problèmes urgents, contacter d'abord l'hôte via la messagerie
- Si pas de réponse sous 24h, le support Lok'Room intervient
- Protection et médiation en cas de litige

Réponds maintenant à la question de l'utilisateur:`;

// Fonction pour normaliser une question (pour le cache)
function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

// Fonction pour vérifier le cache
function getCachedResponse(question: string): string | null {
  const normalized = normalizeQuestion(question);
  const cached = responseCache.get(normalized);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.response;
  }

  // Nettoyer les entrées expirées
  if (cached) {
    responseCache.delete(normalized);
  }

  return null;
}

// Fonction pour mettre en cache une réponse
function cacheResponse(question: string, response: string): void {
  const normalized = normalizeQuestion(question);
  responseCache.set(normalized, {
    response,
    timestamp: Date.now(),
  });

  // Limiter la taille du cache à 1000 entrées
  if (responseCache.size > 1000) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
}

// Réponses prédéfinies pour les questions très fréquentes (économise des appels API)
const PREDEFINED_RESPONSES: Record<string, string> = {
  "bonjour": "Bonjour ! 👋 Je suis l'assistant Lok'Room. Comment puis-je vous aider aujourd'hui ?",
  "salut": "Salut ! 👋 Je suis là pour vous aider. Que puis-je faire pour vous ?",
  "hello": "Bonjour ! 👋 Comment puis-je vous aider ?",
  "merci": "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.",
  "ok": "Parfait ! Je reste disponible si vous avez d'autres questions. 👍",
  "au revoir": "Au revoir et à bientôt sur Lok'Room ! 👋",
  "bye": "À bientôt ! N'hésitez pas à revenir si vous avez des questions. 👋",
};

// Réponses avec liens pour les actions courantes
const ACTION_RESPONSES: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ["changer email", "changer mon email", "modifier email", "modifier mon email", "changer adresse mail", "modifier adresse mail", "nouvelle adresse mail", "nouvel email", "changer mail", "modifier mail"],
    response: "Pour des raisons de sécurité, le changement d'adresse email ne peut pas être effectué directement depuis votre compte. 🔒 Vous devez contacter notre équipe support qui vérifiera votre identité et procédera au changement. Cliquez sur \"Parler à un agent\" ci-dessous pour être mis en relation avec un membre de notre équipe.",
  },
  {
    keywords: ["supprimer compte", "supprimer mon compte", "effacer compte", "fermer compte", "cloturer compte", "clôturer compte", "desactiver compte", "désactiver compte"],
    response: "La suppression de compte nécessite une vérification par notre équipe support pour des raisons de sécurité. 🔒 Cliquez sur \"Parler à un agent\" ci-dessous pour être mis en relation avec un membre de notre équipe qui traitera votre demande.",
  },
  {
    keywords: ["devenir hote", "devenir hôte", "comment devenir hote", "comment devenir hôte", "etre hote", "être hôte", "proposer mon espace", "louer mon espace", "mettre en location", "je veux louer"],
    response: "Pour devenir hôte sur Lok'Room, c'est très simple ! 🏠 Cliquez ici pour créer votre première annonce : [Créer une annonce](/listings/new). Vous deviendrez automatiquement hôte dès la création de votre annonce.",
  },
  {
    keywords: ["creer annonce", "créer annonce", "nouvelle annonce", "ajouter annonce", "publier annonce", "mettre annonce", "poster annonce", "faire une annonce"],
    response: "Pour créer une annonce, cliquez ici : [Créer une annonce](/listings/new) 📝 Vous pourrez ajouter des photos, définir vos tarifs et vos disponibilités.",
  },
  {
    keywords: ["mes reservations", "mes réservations", "voir reservations", "voir réservations", "reservation en cours", "réservation en cours"],
    response: "Vous pouvez consulter toutes vos réservations ici : [Mes réservations](/bookings) 📅",
  },
  {
    keywords: ["mes annonces", "voir mes annonces", "gerer annonces", "gérer annonces", "modifier annonce"],
    response: "Retrouvez et gérez toutes vos annonces ici : [Mes annonces](/host/listings) 🏠",
  },
  {
    keywords: ["mon compte", "mon profil", "modifier profil", "parametres", "paramètres", "reglages", "réglages"],
    response: "Accédez à votre compte et vos paramètres ici : [Mon compte](/account) ⚙️",
  },
  {
    keywords: ["messagerie", "messages", "contacter hote", "contacter hôte", "envoyer message", "discussion"],
    response: "Retrouvez toutes vos conversations ici : [Messagerie](/messages) 💬",
  },
  {
    keywords: ["favoris", "mes favoris", "annonces favorites", "espaces favoris", "wishlist"],
    response: "Consultez vos espaces favoris ici : [Mes favoris](/favorites) ❤️",
  },
  {
    keywords: ["explorer", "rechercher", "trouver espace", "voir annonces", "tous les espaces", "chercher"],
    response: "Explorez tous les espaces disponibles ici : [Explorer](/listings) 🔍",
  },
  {
    keywords: ["tableau de bord", "dashboard", "espace hote", "espace hôte", "gestion hote", "gestion hôte"],
    response: "Accédez à votre tableau de bord hôte ici : [Dashboard hôte](/host) 📊",
  },
  {
    keywords: ["calendrier", "disponibilites", "disponibilités", "gerer dates", "gérer dates"],
    response: "Gérez vos disponibilités dans le calendrier : [Calendrier](/host/calendar) 📆",
  },
  {
    keywords: ["paiement", "paiements", "revenus", "gains", "argent", "portefeuille", "wallet"],
    response: "Consultez vos paiements et revenus ici : [Portefeuille](/host/wallet) 💰",
  },
  {
    keywords: ["aide", "help", "assistance", "support", "probleme", "problème", "question"],
    response: "Consultez notre centre d'aide ici : [Centre d'aide](/help) 🆘 Si vous avez une question spécifique, n'hésitez pas à me la poser !",
  },
];

// Fonction pour obtenir une réponse prédéfinie
function getPredefinedResponse(question: string): string | null {
  const normalized = normalizeQuestion(question);

  // Vérifier les salutations simples
  for (const [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
    if (normalized.includes(key) && normalized.length < 20) {
      return response;
    }
  }

  // Vérifier les réponses avec actions/liens
  for (const action of ACTION_RESPONSES) {
    for (const keyword of action.keywords) {
      const normalizedKeyword = normalizeQuestion(keyword);
      if (normalized.includes(normalizedKeyword)) {
        return action.response;
      }
    }
  }

  return null;
}

// Fonction principale pour obtenir une réponse du bot
export async function getGeminiResponse(userMessage: string): Promise<string> {
  // 1. Vérifier les réponses prédéfinies
  const predefined = getPredefinedResponse(userMessage);
  if (predefined) {
    return predefined;
  }

  // 2. Vérifier le cache
  const cached = getCachedResponse(userMessage);
  if (cached) {
    return cached;
  }

  // 3. Appeler l'API Gemini
  if (!GEMINI_API_KEY) {
    console.error("[Gemini] API key not configured");
    return "Désolé, le service est temporairement indisponible. Veuillez réessayer plus tard ou consulter notre centre d'aide.";
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_CONTEXT}\n\nQuestion: ${userMessage}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[Gemini] API error:", response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extraire la réponse
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error("[Gemini] No response in data:", data);
      throw new Error("No response from API");
    }

    // Mettre en cache la réponse
    cacheResponse(userMessage, aiResponse);

    return aiResponse;
  } catch (error) {
    console.error("[Gemini] Error:", error);
    return "Désolé, je n'ai pas pu traiter votre demande. Vous pouvez consulter notre centre d'aide ou réessayer dans quelques instants.";
  }
}

// Fonction pour obtenir des statistiques du cache
export function getCacheStats() {
  return {
    size: responseCache.size,
    maxSize: 1000,
  };
}
