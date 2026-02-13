/**
 * Honeypot endpoint - Détecte les bots WordPress
 * Cet endpoint n'existe pas vraiment, c'est un piège
 */

import { NextRequest, NextResponse } from "next/server";
import { detectHoneypot } from "@/lib/security/honeypot";

export async function GET(req: NextRequest) {
  await detectHoneypot(req, "wp-admin");

  return NextResponse.json(
    { error: "Not found" },
    { status: 404 }
  );
}

export async function POST(req: NextRequest) {
  await detectHoneypot(req, "wp-admin");

  return NextResponse.json(
    { error: "Not found" },
    { status: 404 }
  );
}
