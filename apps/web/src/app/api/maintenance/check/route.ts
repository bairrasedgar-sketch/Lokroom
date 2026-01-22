/**
 * API de vérification du mode maintenance
 * GET /api/maintenance/check
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "maintenanceMode" },
    });

    const maintenanceMode = config?.value === true;

    return NextResponse.json({ maintenanceMode });
  } catch {
    return NextResponse.json({ maintenanceMode: false });
  }
}
