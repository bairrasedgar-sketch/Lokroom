/**
 * API - Téléchargement d'un export de données
 * GET /api/users/me/export/[id]/download
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const exportId = params.id;

    // Récupérer l'export
    const exportRequest = await prisma.dataExportRequest.findUnique({
      where: { id: exportId },
    });

    if (!exportRequest) {
      return NextResponse.json(
        { error: "Export introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'export appartient à l'utilisateur
    if (exportRequest.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier le statut
    if (exportRequest.status !== "completed") {
      return NextResponse.json(
        {
          error: "Export non disponible",
          status: exportRequest.status,
        },
        { status: 400 }
      );
    }

    // Vérifier l'expiration
    if (exportRequest.expiresAt && exportRequest.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Export expiré" },
        { status: 410 }
      );
    }

    // Vérifier que le fichier existe
    if (!exportRequest.fileUrl) {
      return NextResponse.json(
        { error: "Fichier introuvable" },
        { status: 404 }
      );
    }

    // En production, rediriger vers l'URL S3 signée
    // Pour l'instant, on retourne le fichier en base64
    if (exportRequest.fileUrl.startsWith("data:")) {
      // Extraire le contenu base64
      const matches = exportRequest.fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json(
          { error: "Format de fichier invalide" },
          { status: 500 }
        );
      }

      const contentType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Déterminer l'extension du fichier
      let extension = "bin";
      if (contentType.includes("json")) extension = "json";
      else if (contentType.includes("pdf")) extension = "pdf";
      else if (contentType.includes("zip")) extension = "zip";

      const filename = `lokroom-export-${exportRequest.id}.${extension}`;

      // Logger le téléchargement
      await prisma.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "USER_UPDATED",
          entityType: "DataExportRequest",
          entityId: exportRequest.id,
          details: {
            operation: "USER_DOWNLOADED_EXPORT",
            exportId: exportRequest.id,
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      // Retourner le fichier
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // Si c'est une URL S3, rediriger
    return NextResponse.redirect(exportRequest.fileUrl);
  } catch (error) {
    logger.error("Erreur téléchargement export:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
