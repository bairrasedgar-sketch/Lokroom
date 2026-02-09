import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/search/saved
 * Récupère les recherches sauvegardées de l'utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pour l'instant, on retourne un tableau vide
    // TODO: Créer un modèle SavedSearch dans Prisma
    const searches: any[] = [];

    return NextResponse.json({ searches });
  } catch (err) {
    console.error("GET /api/search/saved error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/saved
 * Sauvegarde une nouvelle recherche
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, filters, alertEnabled } = body;

    if (!name || !filters) {
      return NextResponse.json(
        { error: "Name and filters are required" },
        { status: 400 }
      );
    }

    // TODO: Créer la recherche sauvegardée en DB
    // Pour l'instant, on retourne un objet mock
    const savedSearch = {
      id: `search_${Date.now()}`,
      userId: user.id,
      name,
      filters,
      alertEnabled: alertEnabled || false,
      createdAt: new Date(),
    };

    return NextResponse.json({ savedSearch }, { status: 201 });
  } catch (err) {
    console.error("POST /api/search/saved error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
