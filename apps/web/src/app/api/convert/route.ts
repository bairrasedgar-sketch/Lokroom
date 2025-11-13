import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount, from, to } = (await req.json()) as {
      amount: number;
      from: "EUR" | "CAD";
      to: "EUR" | "CAD";
    };

    if (
      typeof amount !== "number" ||
      (from !== "EUR" && from !== "CAD") ||
      (to !== "EUR" && to !== "CAD")
    ) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    if (from === to) {
      return NextResponse.json({ value: Number(amount.toFixed(2)) });
    }

    const { convert } = await import("@/lib/rates.server");
    const value = await convert(amount, from, to);
    return NextResponse.json({ value });
  } catch {
    return NextResponse.json({ error: "Convert failed" }, { status: 500 });
  }
}
