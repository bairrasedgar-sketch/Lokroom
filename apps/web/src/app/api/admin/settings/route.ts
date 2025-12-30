/**
 * API Admin - Configuration système
 * GET /api/admin/settings
 * PUT /api/admin/settings
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";

// Clés de configuration par défaut
const DEFAULT_CONFIG: Record<string, unknown> = {
  hostFeePercent: 3,
  guestFeePercent: 12,
  gstPercent: 5,
  pstPercent: 9.975,
  maxImagesPerListing: 20,
  maxListingsPerHost: 50,
  minPricePerNight: 10,
  maxPricePerNight: 10000,
  bookingExpirationHours: 24,
  reviewWindowDays: 14,
  disputeWindowDays: 30,
  payoutDelayDays: 3,
  minPayoutAmount: 100,
  maintenanceMode: false,
  maintenanceMessage: "",
};

export async function GET() {
  const auth = await requireAdminPermission("config:view");
  if ("error" in auth) return auth.error;

  try {
    // Récupérer toutes les configs
    const configs = await prisma.systemConfig.findMany({
      where: {
        category: "platform",
      },
    });

    // Construire l'objet de config avec les valeurs par défaut
    const config = { ...DEFAULT_CONFIG };
    configs.forEach((c) => {
      config[c.key] = c.value;
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Erreur API admin settings:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminPermission("config:edit");
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();

    // Valider les valeurs numériques
    if (
      typeof body.hostFeePercent === "number" &&
      (body.hostFeePercent < 0 || body.hostFeePercent > 50)
    ) {
      return NextResponse.json(
        { error: "Commission hôte doit être entre 0 et 50%" },
        { status: 400 }
      );
    }

    if (
      typeof body.guestFeePercent === "number" &&
      (body.guestFeePercent < 0 || body.guestFeePercent > 50)
    ) {
      return NextResponse.json(
        { error: "Commission voyageur doit être entre 0 et 50%" },
        { status: 400 }
      );
    }

    // Upsert chaque config
    const updates = Object.entries(body).map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: {
          value: value as object,
          updatedById: auth.session.user.id,
        },
        create: {
          id: `config_${key}`,
          key,
          value: value as object,
          category: "platform",
          updatedById: auth.session.user.id,
        },
      })
    );

    await Promise.all(updates);

    // Log l'action
    await logAdminAction({
      adminId: auth.session.user.id,
      action: "CONFIG_CHANGED",
      targetType: "SystemConfig",
      targetId: "platform",
      details: body,
      request,
    });

    return NextResponse.json({ success: true, config: body });
  } catch (error) {
    console.error("Erreur API admin settings:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
