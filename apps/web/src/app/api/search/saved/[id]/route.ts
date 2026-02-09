import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/search/saved/[id]
 * Supprime une recherche sauvegardée
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // TODO: Supprimer la recherche sauvegardée en DB
    // Pour l'instant, on retourne juste un succès

    return NextResponse.json({ message: "Search deleted" });
  } catch (err) {
    console.error("DELETE /api/search/saved/[id] error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
