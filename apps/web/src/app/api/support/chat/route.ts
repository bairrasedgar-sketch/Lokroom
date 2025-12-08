// API endpoint pour le chatbot support Lok'Room
import { NextRequest, NextResponse } from "next/server";
import { getGeminiResponse } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Rate limiting simple (en mémoire)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // 20 messages par minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Trop de messages. Veuillez patienter une minute." },
        { status: 429 }
      );
    }

    // Parser le body
    const body = await req.json().catch(() => null);
    const message = body?.message;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Limiter la longueur du message
    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Message trop long (max 1000 caractères)" },
        { status: 400 }
      );
    }

    // Obtenir la réponse de Gemini
    const response = await getGeminiResponse(message.trim());

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Support Chat] Error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
