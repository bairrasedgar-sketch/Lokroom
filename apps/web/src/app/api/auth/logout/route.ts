import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Supprime le cookie de session
  cookies().delete("session");

  return NextResponse.json({ ok: true });
}
