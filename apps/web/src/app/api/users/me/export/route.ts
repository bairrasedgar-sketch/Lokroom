/**
 * API - Export des données personnelles (Droit à la portabilité RGPD)
 * POST /api/users/me/export - Demander un export
 * GET /api/users/me/export - Historique des exports
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { collectUserData } from "@/lib/export/user-data";
import { generateJSON } from "@/lib/export/formats/json";
import { generateCSV } from "@/lib/export/formats/csv";
import { generatePDF } from "@/lib/export/formats/pdf";
import { generateZIP, generateZIPWithoutPhotos } from "@/lib/export/formats/zip";
import { z } from "zod";

// Schéma de validation pour la requête d'export
const exportRequestSchema = z.object({
  format: z.enum(["json", "csv", "pdf", "zip", "zip-no-photos"]).default("json"),
});

// Rate limiting: 1 export par heure par utilisateur
const RATE_LIMIT_HOURS = 1;
const EXPORT_EXPIRY_DAYS = 7;

/**
 * POST /api/users/me/export
 * Créer une demande d'export de données
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Valider le body
    const body = await req.json();
    const validation = exportRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Format invalide", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { format } = validation.data;

    // Vérifier le rate limiting
    const recentExport = await prisma.dataExportRequest.findFirst({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentExport) {
      const nextAllowed = new Date(recentExport.createdAt);
      nextAllowed.setHours(nextAllowed.getHours() + RATE_LIMIT_HOURS);

      return NextResponse.json(
        {
          error: "Limite de fréquence atteinte",
          message: `Vous pouvez demander un nouvel export dans ${RATE_LIMIT_HOURS} heure(s)`,
          lastExport: recentExport.createdAt,
          nextAllowedAt: nextAllowed,
        },
        { status: 429 }
      );
    }

    // Créer la demande d'export
    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId: session.user.id,
        status: "processing",
      },
    });

    // Collecter les données utilisateur
    const userData = await collectUserData(session.user.id);

    if (!userData) {
      await prisma.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: {
          status: "failed",
        },
      });

      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Générer l'export selon le format demandé
    let fileContent: Buffer | string;
    let contentType: string;
    let filename: string;

    try {
      switch (format) {
        case "json":
          fileContent = generateJSON(userData);
          contentType = "application/json";
          filename = `lokroom-export-${session.user.id}-${Date.now()}.json`;
          break;

        case "csv": {
          const csvFiles = generateCSV(userData);
          // Pour CSV, on retourne un ZIP avec tous les fichiers CSV
          const JSZip = (await import("jszip")).default;
          const zip = new JSZip();
          Object.entries(csvFiles).forEach(([name, content]) => {
            zip.file(name, content);
          });
          fileContent = await zip.generateAsync({ type: "nodebuffer" });
          contentType = "application/zip";
          filename = `lokroom-export-csv-${session.user.id}-${Date.now()}.zip`;
          break;
        }

        case "pdf":
          fileContent = generatePDF(userData);
          contentType = "application/pdf";
          filename = `lokroom-export-${session.user.id}-${Date.now()}.pdf`;
          break;

        case "zip":
          fileContent = await generateZIP(userData);
          contentType = "application/zip";
          filename = `lokroom-export-${session.user.id}-${Date.now()}.zip`;
          break;

        case "zip-no-photos":
          fileContent = await generateZIPWithoutPhotos(userData);
          contentType = "application/zip";
          filename = `lokroom-export-${session.user.id}-${Date.now()}.zip`;
          break;

        default:
          throw new Error("Format non supporté");
      }

      // Calculer la taille du fichier
      const fileSize = Buffer.isBuffer(fileContent)
        ? fileContent.length
        : Buffer.from(fileContent).length;

      // Date d'expiration (7 jours)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + EXPORT_EXPIRY_DAYS);

      // En production, uploader sur S3/R2 et obtenir une URL signée
      // Pour l'instant, on stocke en base64 (pas idéal pour la prod)
      const fileBase64 = Buffer.isBuffer(fileContent)
        ? fileContent.toString("base64")
        : Buffer.from(fileContent).toString("base64");

      // Mettre à jour la demande d'export
      await prisma.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          expiresAt,
          fileSize,
          // En production: fileUrl serait une URL S3 signée
          fileUrl: `data:${contentType};base64,${fileBase64}`,
        },
      });

      // Logger l'export (conformité RGPD)
      await prisma.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "USER_EXPORTED_DATA",
          entityType: "User",
          entityId: session.user.id,
          details: {
            format,
            fileSize,
            exportId: exportRequest.id,
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Export généré avec succès",
        export: {
          id: exportRequest.id,
          format,
          fileSize,
          expiresAt,
          downloadUrl: `/api/users/me/export/${exportRequest.id}/download`,
        },
      });
    } catch (error) {
      console.error("Erreur génération export:", error);

      await prisma.dataExportRequest.update({
        where: { id: exportRequest.id },
        data: {
          status: "failed",
        },
      });

      return NextResponse.json(
        { error: "Erreur lors de la génération de l'export" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur export données:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/me/export
 * Récupérer l'historique des exports
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les 10 derniers exports
    const exports = await prisma.dataExportRequest.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        createdAt: true,
        completedAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({
      exports: exports.map((exp) => ({
        id: exp.id,
        status: exp.status,
        createdAt: exp.createdAt,
        completedAt: exp.completedAt,
        expiresAt: exp.expiresAt,
        downloadUrl:
          exp.status === "completed" &&
          exp.expiresAt &&
          exp.expiresAt > new Date()
            ? `/api/users/me/export/${exp.id}/download`
            : null,
        isExpired: exp.expiresAt ? exp.expiresAt < new Date() : false,
      })),
    });
  } catch (error) {
    console.error("Erreur récupération exports:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
