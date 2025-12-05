// apps/web/src/app/api/host/activate/route.ts
// Endpoint pour activer le mode hôte sans passer par Stripe Connect
// Cela crée le HostProfile et met à jour le rôle utilisateur

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        identityStatus: true,
        hostProfile: {
          select: { id: true }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Si déjà hôte, retourner le statut actuel
    const isAlreadyHost = user.role === "HOST" || user.role === "BOTH" || user.hostProfile;

    if (isAlreadyHost && user.hostProfile) {
      return NextResponse.json({
        success: true,
        alreadyHost: true,
        role: user.role,
        identityStatus: user.identityStatus,
      });
    }

    // Créer le HostProfile si n'existe pas
    if (!user.hostProfile) {
      await prisma.hostProfile.create({
        data: { userId: user.id },
      });
    }

    // Mettre à jour le rôle : GUEST -> BOTH, sinon HOST
    const newRole = user.role === "GUEST" ? "BOTH" : "HOST";

    await prisma.user.update({
      where: { id: user.id },
      data: { role: newRole },
    });

    return NextResponse.json({
      success: true,
      alreadyHost: false,
      role: newRole,
      identityStatus: user.identityStatus,
      message: "Mode hôte activé avec succès",
    });
  } catch (e: unknown) {
    console.error("host/activate error:", e);
    const msg = e instanceof Error ? e.message : "Erreur activation hôte";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
