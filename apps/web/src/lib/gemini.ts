// Service Gemini AI pour le support bot Lok'Room
// Avec système de cache pour réduire les coûts

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Cache en mémoire pour les réponses fréquentes (durée: 1 heure)
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en ms

// Contexte système pour le bot Lok'Room
const SYSTEM_CONTEXT = `Tu es l'assistant virtuel de Lok'Room, une plateforme de location d'espaces (comme Airbnb mais pour des espaces de travail, studios, salles de réunion, etc.).

RÈGLES IMPORTANTES:
- Réponds TOUJOURS en français
- Sois concis et amical (max 3-4 phrases par réponse)
- Utilise des emojis avec modération (1-2 max)
- Si tu ne sais pas, dis-le honnêtement et suggère de contacter le support humain

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

🏠 DEVENIR HÔTE:
- Créer un compte et compléter la vérification d'identité
- Ajouter une annonce avec photos et description
- Connecter un compte Stripe pour recevoir les paiements
- Commission Lok'Room: 3% par réservation

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
    console.log("[Gemini] Cache hit for:", normalized.substring(0, 50));
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

// Fonction pour obtenir une réponse prédéfinie
function getPredefinedResponse(question: string): string | null {
  const normalized = normalizeQuestion(question);

  for (const [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
    if (normalized.includes(key) && normalized.length < 20) {
      return response;
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
      const errorData = await response.json().catch(() => ({}));
      console.error("[Gemini] API error:", response.status, errorData);
      throw new Error(`API error: ${response.status}`);
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
