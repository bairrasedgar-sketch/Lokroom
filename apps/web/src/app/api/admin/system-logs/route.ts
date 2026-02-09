export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const session = await getServerSession();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = req.nextUrl.searchParams.get("filter") || "all";
    const date = new Date().toISOString().split("T")[0];

    let filename = "app";
    if (filter === "error") filename = "error";
    if (filter === "http") filename = "http";
    if (filter === "business") filename = "business";

    const logPath = join(process.cwd(), "logs", `${filename}-${date}.log`);

    try {
      const content = await readFile(logPath, "utf-8");
      const lines = content.split("\n").filter(line => line.trim()).slice(-100); // 100 dernières lignes

      return NextResponse.json(lines);
    } catch (error) {
      // Si le fichier n'existe pas, retourner un tableau vide
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error reading logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
