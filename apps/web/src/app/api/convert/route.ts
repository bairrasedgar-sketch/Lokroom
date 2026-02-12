import { NextResponse } from "next/server";
import type { Currency } from "@/lib/currency";
import { logger } from "@/lib/logger";


const ALLOWED: Currency[] = ["EUR", "CAD", "USD", "GBP", "CNY"];

export async function POST(req: Request) {
  try {
    const { amount, from, to } = (await req.json()) as {
      amount: number;
      from: Currency;
      to: Currency;
    };

    // validation basique
    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      !ALLOWED.includes(from) ||
      !ALLOWED.includes(to)
    ) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    // pas besoin de conversion
    if (from === to) {
      return NextResponse.json({
        value: Number(amount.toFixed(2)),
      });
    }

    const { convert } = await import("@/lib/rates.server");
    const value = await convert(amount, from, to);

    return NextResponse.json({ value });
  } catch (e) {
    logger.error("Convert API error:", e);
    return NextResponse.json({ error: "Convert failed" }, { status: 500 });
  }
}
