import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/search/saved/[id]/alert
 * Active/désactive les alertes pour une recherche sauvegardée
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 }
      );
    }

    // TODO: Mettre à jour la recherche sauvegardée en DB
    // Pour l'instant, on retourne juste un succès

    return NextResponse.json({ message: "Alert updated", enabled });
  } catch (err) {
    console.error("PATCH /api/search/saved/[id]/alert error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
