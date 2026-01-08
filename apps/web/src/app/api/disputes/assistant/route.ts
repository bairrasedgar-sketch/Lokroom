// API endpoint pour l'assistant IA des litiges Lok'Room
// L'IA aide à mieux comprendre et formuler le problème, sans le résoudre
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Contexte système spécialisé pour l'assistant litiges
const DISPUTE_ASSISTANT_CONTEXT = `Tu es l'assistant IA de Lok'Room spécialisé dans l'aide aux litiges et problèmes de réservation.

🎯 TON RÔLE:
- Aider l'utilisateur à MIEUX DÉCRIRE son problème
- Poser des questions pour CLARIFIER la situation
- Suggérer la BONNE CATÉGORIE de litige
- Préparer un RÉSUMÉ CLAIR pour l'équipe support
- Tu NE RÉSOUS PAS les litiges, tu aides à les formuler

⚠️ RÈGLES IMPORTANTES:
- Réponds TOUJOURS en français
- Sois empathique mais professionnel
- Pose des questions précises pour comprendre le problème
- Ne promets JAMAIS de résolution ou de remboursement
- Suggère toujours de contacter l'hôte d'abord si ce n'est pas fait
- Reste neutre, ne prends pas parti

📋 CATÉGORIES DE LITIGES:
1. PROPERTY_NOT_AS_DESCRIBED - Le logement ne correspond pas à l'annonce
2. CLEANLINESS_ISSUE - Problème de propreté
3. AMENITIES_MISSING - Équipements manquants ou défectueux
4. HOST_UNRESPONSIVE - L'hôte ne répond pas
5. GUEST_DAMAGE - Dégâts causés par le voyageur (pour les hôtes)
6. GUEST_VIOLATION - Violation des règles par le voyageur (pour les hôtes)
7. PAYMENT_ISSUE - Problème de paiement
8. CANCELLATION_DISPUTE - Litige sur une annulation
9. SAFETY_CONCERN - Problème de sécurité (PRIORITAIRE)
10. NOISE_COMPLAINT - Nuisances sonores
11. UNAUTHORIZED_GUESTS - Personnes non autorisées
12. OTHER - Autre problème

🔍 QUESTIONS À POSER SELON LE CONTEXTE:
- Quand le problème s'est-il produit ?
- Avez-vous des photos ou preuves ?
- Avez-vous contacté l'hôte/voyageur ?
- Quelle solution attendez-vous ?
- Le problème est-il résolu ou persiste-t-il ?

📝 FORMAT DE RÉPONSE:
- Commence par montrer que tu comprends le problème
- Pose 1-2 questions de clarification si nécessaire
- Si tu as assez d'infos, propose un résumé structuré
- Termine par la prochaine étape recommandée

Quand tu as assez d'informations, génère un résumé au format:
---RÉSUMÉ---
Catégorie suggérée: [CATÉGORIE]
Problème: [Description courte]
Détails: [Points clés]
Preuves mentionnées: [Oui/Non + type]
Contact hôte: [Oui/Non]
Priorité suggérée: [Normale/Haute/Urgente]
---FIN---`;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Rate limiting par utilisateur
    const userId = session.user.email;
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Trop de messages. Veuillez patienter." },
        { status: 429 }
      );
    }

    // Parser le body
    const body = await req.json().catch(() => null);
    const { message, history, bookingContext } = body as {
      message: string;
      history?: Message[];
      bookingContext?: {
        listingTitle?: string;
        startDate?: string;
        endDate?: string;
        hostName?: string;
        totalPrice?: number;
      };
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message trop long (max 2000 caractères)" },
        { status: 400 }
      );
    }

    // Vérifier la clé API
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Service IA non configuré" },
        { status: 500 }
      );
    }

    // Construire le contexte avec l'historique
    let contextWithHistory = DISPUTE_ASSISTANT_CONTEXT;

    // Ajouter le contexte de la réservation si disponible
    if (bookingContext) {
      contextWithHistory += `\n\n📍 CONTEXTE DE LA RÉSERVATION:
- Annonce: ${bookingContext.listingTitle || "Non spécifié"}
- Dates: ${bookingContext.startDate || "?"} - ${bookingContext.endDate || "?"}
- Hôte: ${bookingContext.hostName || "Non spécifié"}
- Montant: ${bookingContext.totalPrice ? `${bookingContext.totalPrice}€` : "Non spécifié"}`;
    }

    // Construire l'historique de conversation pour Gemini
    const conversationParts: { text: string }[] = [];

    // Ajouter le contexte système
    conversationParts.push({ text: contextWithHistory });

    // Ajouter l'historique des messages
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // Garder les 10 derniers messages
        const prefix = msg.role === "user" ? "Utilisateur: " : "Assistant: ";
        conversationParts.push({ text: prefix + msg.content });
      }
    }

    // Ajouter le nouveau message
    conversationParts.push({ text: "Utilisateur: " + message.trim() });
    conversationParts.push({ text: "Assistant: " });

    // Appeler l'API Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: conversationParts,
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[Dispute Assistant] API error:", response.status);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response from API");
    }

    // Parser le résumé si présent
    let summary = null;
    if (aiResponse.includes("---RÉSUMÉ---")) {
      const summaryMatch = aiResponse.match(/---RÉSUMÉ---([\s\S]*?)---FIN---/);
      if (summaryMatch) {
        const summaryText = summaryMatch[1].trim();
        const lines = summaryText.split("\n");
        summary = {
          category: "",
          problem: "",
          details: "",
          hasEvidence: false,
          contactedHost: false,
          priority: "normal",
        };

        for (const line of lines) {
          if (line.startsWith("Catégorie suggérée:")) {
            summary.category = line.replace("Catégorie suggérée:", "").trim();
          } else if (line.startsWith("Problème:")) {
            summary.problem = line.replace("Problème:", "").trim();
          } else if (line.startsWith("Détails:")) {
            summary.details = line.replace("Détails:", "").trim();
          } else if (line.startsWith("Preuves mentionnées:")) {
            summary.hasEvidence = line.toLowerCase().includes("oui");
          } else if (line.startsWith("Contact hôte:")) {
            summary.contactedHost = line.toLowerCase().includes("oui");
          } else if (line.startsWith("Priorité suggérée:")) {
            const prio = line.toLowerCase();
            if (prio.includes("urgente")) summary.priority = "urgent";
            else if (prio.includes("haute")) summary.priority = "high";
            else summary.priority = "normal";
          }
        }
      }
    }

    // Nettoyer la réponse (enlever le résumé technique)
    const cleanResponse = aiResponse
      .replace(/---RÉSUMÉ---[\s\S]*?---FIN---/, "")
      .trim();

    return NextResponse.json({
      response: cleanResponse,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Dispute Assistant] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de votre demande" },
      { status: 500 }
    );
  }
}
