import { NextResponse } from "next/server";

export async function GET() {
  // Route de test ultra simple : aucune BDD, aucun NextAuth
  return NextResponse.json({
    ok: true,
    listings: [],
    message: "Test route /api/listings OK",
  });
}
